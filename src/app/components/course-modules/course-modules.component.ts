import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { CourseModule, Course } from '../../services/training.service';

@Component({
  selector: 'app-course-modules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="course-modules-container">
      <!-- Header Section -->
      <header class="course-header">
        <div class="course-info">
          <div class="course-basic">
            <img [src]="course?.image" [alt]="course?.title" class="course-thumbnail">
            <div class="course-details">
              <h1>{{ course?.title }}</h1>
              <p class="course-description">{{ course?.description }}</p>
              <div class="course-meta">
                <span class="duration">{{ course?.duration }}h duration</span>
                <span class="modules-count">{{ course?.modules }} modules</span>
                <span class="completion">{{ course?.completionRate }}% complete</span>
              </div>
            </div>
          </div>
          <div class="progress-section">
            <div class="overall-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="course?.completionRate"></div>
              </div>
              <span class="progress-text">Your Progress: {{ course?.completionRate }}%</span>
            </div>
          </div>
        </div>
        <nav class="course-navigation">
          <button class="nav-btn back" (click)="goBack()">← Back to Courses</button>
        </nav>
      </header>

      <!-- Modules Section -->
      <main class="modules-content">
        <h2>Course Modules</h2>

        <!-- Modules Accordion -->
        <div class="modules-accordion">
          <div class="module-item" *ngFor="let module of courseModules; trackBy: trackByModuleId">
            <div class="module-header" (click)="toggleModule(module.id)">
              <div class="module-info">
                <div class="module-type" [class]="module.type">
                  <span class="type-icon">
                    {{ module.type === 'video' ? '📹' :
                       module.type === 'quiz' ? '📝' :
                       module.type === 'reading' ? '📖' :
                       module.type === 'assignment' ? '✏️' :
                       module.type === 'presentation' ? '📊' : '📄' }}
                  </span>
                </div>
                <div class="module-title">
                  <h3>{{ module.title }}</h3>
                  <div class="module-meta">
                    <span class="duration">{{ module.duration }} min</span>
                    <span class="type-label">{{ getTypeLabel(module.type) }}</span>
                  </div>
                </div>
              </div>

              <div class="module-status">
                <div class="completion-indicator" [class.completed]="module.isCompleted">
                  <span *ngIf="module.isCompleted">✓</span>
                  <span *ngIf="!module.isCompleted">{{ module.type === 'video' ? '▶' : '→' }}</span>
                </div>
                <div class="expand-icon" [class.expanded]="expandedModules.has(module.id)">
                  <span>▼</span>
                </div>
              </div>
            </div>

            <div class="module-content" *ngIf="expandedModules.has(module.id)">
              <div class="module-details">
                <p class="module-description">
                  {{ getModuleDescription(module.type) }}
                </p>

                <div class="module-actions">
                  <button
                    class="start-btn"
                    (click)="startModule(module)"
                    [disabled]="isModuleDisabled(module)"
                  >
                    {{ module.isCompleted ? 'Review' : 'Start' }} {{ getTypeLabel(module.type) }}
                  </button>

                  <button
                    class="complete-btn"
                    *ngIf="!module.isCompleted && canMarkComplete(module)"
                    (click)="markAsComplete(module)"
                  >
                    Mark as Complete
                  </button>
                </div>

                <div class="module-content-area" *ngIf="module.id === currentModule?.id">
                  <div class="content-placeholder">
                    <div class="content-icon">
                      {{ module.type === 'video' ? '🎬' :
                         module.type === 'quiz' ? '🧩' :
                         module.type === 'reading' ? '📚' :
                         module.type === 'assignment' ? '📝' :
                         module.type === 'presentation' ? '📈' : '📄' }}
                    </div>
                    <h4>Content Area</h4>
                    <p>This is where the {{ module.type }} content would load for "{{ module.title }}"</p>
                  </div>
                </div>

                <!-- Sample content based on type -->
                <div class="module-resources" *ngIf="module.content">
                  <h4>Additional Resources:</h4>
                  <div class="resource-item">
                    <p>{{ module.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .course-modules-container {
      min-height: 100vh;
      background: var(--netflix-bg);
      color: var(--ford-white);
    }

    /* Course Header */
    .course-header {
      padding: 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .course-info {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .course-basic {
      display: flex;
      gap: 2rem;
      flex: 1;
    }

    .course-thumbnail {
      width: 200px;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
    }

    .course-details h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }

    .course-description {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 1rem;
    }

    .course-meta {
      display: flex;
      gap: 2rem;
      font-size: 0.9rem;
      color: var(--ford-light-blue);
    }

    /* Progress Section */
    .progress-section {
      flex-shrink: 0;
      width: 300px;
    }

    .overall-progress {
      background: rgba(0,0,0,0.3);
      padding: 1.5rem;
      border-radius: 12px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--ford-light-blue);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-text {
      font-size: 0.9rem;
      color: var(--ford-white);
      text-align: center;
    }

    /* Navigation */
    .course-navigation {
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .nav-btn.back {
      background: var(--ford-medium-blue);
      color: var(--ford-white);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .nav-btn.back:hover {
      background: var(--ford-dark-blue);
    }

    /* Modules Content */
    .modules-content {
      padding: 2rem;
    }

    .modules-content h2 {
      font-size: 1.8rem;
      margin-bottom: 2rem;
      color: var(--ford-white);
    }

    /* Accordion Styles */
    .modules-accordion {
      max-width: 1000px;
      margin: 0 auto;
    }

    .module-item {
      margin-bottom: 0.5rem;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .module-item:hover {
      background: rgba(0,0,0,0.4);
    }

    .module-header {
      padding: 1.5rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.3s ease;
    }

    .module-header:hover {
      background: rgba(255,255,255,0.05);
    }

    .module-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .module-type {
      flex-shrink: 0;
    }

    .type-icon {
      font-size: 1.5rem;
    }

    .module-type.video {
      color: #ff6b6b;
    }

    .module-type.quiz {
      color: #4ecdc4;
    }

    .module-type.reading {
      color: #45b7d1;
    }

    .module-type.assignment {
      color: #96ceb4;
    }

    .module-type.presentation {
      color: #feca57;
    }

    .module-title h3 {
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
      color: var(--ford-white);
      font-weight: 500;
    }

    .module-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.7);
    }

    .module-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .completion-indicator {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      transition: all 0.3s ease;
    }

    .completion-indicator.completed {
      background: #28a745;
      color: white;
    }

    .expand-icon {
      transition: transform 0.3s ease;
    }

    .expand-icon.expanded {
      transform: rotate(180deg);
    }

    /* Module Content */
    .module-content {
      border-top: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.2);
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from { max-height: 0; opacity: 0; }
      to { max-height: 1000px; opacity: 1; }
    }

    .module-details {
      padding: 1.5rem;
    }

    .module-description {
      color: rgba(255,255,255,0.9);
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    /* Module Actions */
    .module-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .start-btn, .complete-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
      cursor: pointer;
      border: none;
    }

    .start-btn {
      background: var(--ford-medium-blue);
      color: white;
    }

    .start-btn:hover:not(:disabled) {
      background: var(--ford-dark-blue);
      transform: translateY(-1px);
    }

    .start-btn:disabled {
      background: rgba(255,255,255,0.2);
      cursor: not-allowed;
    }

    .complete-btn {
      background: #28a745;
      color: white;
    }

    .complete-btn:hover {
      background: #218838;
      transform: translateY(-1px);
    }

    /* Content Area */
    .module-content-area {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 1.5rem;
    }

    .content-placeholder {
      text-align: center;
      color: rgba(255,255,255,0.8);
    }

    .content-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .content-placeholder h4 {
      margin-bottom: 0.5rem;
      color: var(--ford-white);
    }

    .content-placeholder p {
      margin: 0;
      font-style: italic;
    }

    /* Resources */
    .module-resources {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .module-resources h4 {
      margin-bottom: 1rem;
      color: var(--ford-white);
      font-size: 1.1rem;
    }

    .resource-item {
      background: rgba(255,255,255,0.05);
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .resource-item p {
      margin: 0;
      color: rgba(255,255,255,0.9);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .course-info {
        flex-direction: column;
        gap: 1.5rem;
      }

      .progress-section {
        width: 100%;
      }

      .course-thumbnail {
        width: 180px;
        height: 135px;
      }

      .course-details h1 {
        font-size: 2rem;
      }
    }

    @media (max-width: 768px) {
      .course-header {
        padding: 1.5rem;
      }

      .course-basic {
        flex-direction: column;
        gap: 1.5rem;
      }

      .course-thumbnail {
        width: 100%;
        height: 200px;
      }

      .modules-content {
        padding: 1.5rem;
      }

      .module-header {
        padding: 1rem;
      }

      .module-actions {
        flex-direction: column;
      }

      .start-btn, .complete-btn {
        width: 100%;
      }
    }

    @media (max-width: 576px) {
      .course-details h1 {
        font-size: 1.5rem;
      }

      .course-description {
        font-size: 1rem;
      }

      .modules-content h2 {
        font-size: 1.5rem;
      }

      .module-title h3 {
        font-size: 1rem;
      }
    }
  `]
})
export class CourseModulesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trainingService = inject(TrainingService);
  private authService = inject(AuthService);

  course: Course | undefined;
  courseModules: CourseModule[] = [];
  expandedModules = new Set<number>();
  currentModule: CourseModule | null = null;

  ngOnInit() {
    this.loadCourse();
  }

  loadCourse() {
    const courseId = Number(this.route.snapshot.queryParams['courseId']);
    if (courseId) {
      // Load courses from Supabase
      this.trainingService.loadCoursesFromSupabase().subscribe({
        next: (courses) => {
          this.course = courses.find(c => c.id === courseId);
          if (this.course) {
            this.courseModules = this.course.courseModules;
          }
        },
        error: (error) => {
          console.error('Error loading course:', error);
          // Fallback to local data if Supabase fails
          const allCourses = this.trainingService.getCourses();
          this.course = allCourses.find(c => c.id === courseId);
          if (this.course) {
            this.courseModules = this.course.courseModules;
          }
        }
      });
    }
  }

  toggleModule(moduleId: number) {
    if (this.expandedModules.has(moduleId)) {
      this.expandedModules.delete(moduleId);
      if (this.currentModule?.id === moduleId) {
        this.currentModule = null;
      }
    } else {
      this.expandedModules.add(moduleId);
    }
  }

  startModule(module: CourseModule) {
    this.currentModule = module;
  }

  markAsComplete(module: CourseModule) {
    // Mark module as completed
    module.isCompleted = true;

    // Update module in service
    if (this.course) {
      this.trainingService.updateModule(this.course.id, module);

      // Update course progress
      const completedModules = this.courseModules.filter(m => m.isCompleted).length;
      this.course.completionRate = Math.round((completedModules / this.courseModules.length) * 100);

      // Update the course in service
      this.trainingService.updateCourse(this.course);
    }

    // Show completion message
    alert(`Module "${module.title}" marked as complete! 🎉`);
  }

  isModuleDisabled(module: CourseModule): boolean {
    // Check if previous modules are completed
    const moduleIndex = this.courseModules.findIndex(m => m.id === module.id);
    for (let i = 0; i < moduleIndex; i++) {
      if (!this.courseModules[i].isCompleted) {
        return true;
      }
    }
    return false;
  }

  canMarkComplete(module: CourseModule): boolean {
    // Only certain types can be manually marked complete
    return !['video', 'reading', 'presentation'].includes(module.type) ||
           this.currentModule?.id === module.id;
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'video': 'Video',
      'quiz': 'Quiz',
      'reading': 'Reading',
      'assignment': 'Assignment',
      'presentation': 'Presentation'
    };
    return labels[type] || 'Content';
  }

  getModuleDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'video': 'Watch this instructional video to learn new concepts and techniques.',
      'quiz': 'Test your knowledge with this interactive quiz.',
      'reading': 'Read through this comprehensive learning material.',
      'assignment': 'Complete this hands-on assignment to practice your skills.',
      'presentation': 'Review this presentation containing key concepts and data.'
    };
    return descriptions[type] || 'Access this learning content to continue your progress.';
  }

  trackByModuleId(index: number, module: CourseModule): number {
    return module.id;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}