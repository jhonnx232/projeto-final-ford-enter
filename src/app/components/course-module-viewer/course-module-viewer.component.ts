import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { CourseModule, Course } from '../../services/training.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-course-module-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-module-viewer.component.html',
  styleUrl: './course-module-viewer.component.css'
})
export class CourseModuleViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trainingService = inject(TrainingService);
  private authService = inject(AuthService);

  course: Course | undefined;
  courseModules: CourseModule[] = [];
  expandedModules = new Set<number>();
  currentModule: CourseModule | null = null;

  // New Udemy-style properties
  sidebarCollapsed = false;
  currentSlideIndex = 0;
  totalSlides = 1;

  ngOnInit() {
    this.loadCourse();
  }

  loadCourse() {
    const courseId = this.route.snapshot.queryParams['courseId'];
    if (courseId) {
      // Find course by ID
      const allCourses = this.trainingService.getCourses();
      this.course = allCourses.find(c => c.id === courseId);

      if (this.course) {
        this.courseModules = this.course.courseModules;
      }
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

    // Update the module in Supabase
    if (this.course) {
      this.trainingService.updateModule(this.course.id, module).subscribe({
        next: () => {
          // Update course progress based on modules completion rate
          this.updateCourseProgress();
          // Show completion message
          alert(`Module "${module.title}" marked as complete! 🎉`);

          // Check if all modules are completed
          const allCompleted = this.courseModules.every(m => m.isCompleted);
          if (allCompleted) {
            this.handleCourseCompletion();
          }
        },
        error: (err) => {
          console.error('Error marking module as complete:', err);
          alert('Error updating module status. Please try again.');
          module.isCompleted = false; // Rollback
        }
      });
    }
  }

  private handleCourseCompletion() {
    if (this.course) {
      // Show completion message
      alert(`Congratulations! You have completed the entire "${this.course?.titulo}" course! 🏆`);
    }
  }

  private updateCourseProgress() {
    if (this.course && this.courseModules.length > 0) {
      const completedModules = this.courseModules.filter(m => m.isCompleted).length;
      const totalModules = this.courseModules.length;
      this.course.completionRate = Math.round((completedModules / totalModules) * 100);

      // Update the course in service
      this.trainingService.updateCourse(this.course).subscribe({
        error: (err) => console.error('Error updating course progress:', err)
      });
    }
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

  getTotalDuration(course: Course | undefined): number {
    if (!course || !course.courseModules.length) return 0;
    const totalMinutes = course.courseModules.reduce((sum, module) => sum + module.duration, 0);
    return +(totalMinutes / 60).toFixed(1); // Convert to hours and round to 1 decimal
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

  // Udemy-style methods
  selectModule(module: CourseModule) {
    // Allow selection only if not disabled
    if (!this.isModuleDisabled(module)) {
      this.currentModule = module;
      this.expandedModules.add(module.id);

      // Reset slide navigation for presentations
      if (module.type === 'presentation') {
        this.currentSlideIndex = 0;
        this.totalSlides = 10; // Mock number of slides
      }
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getPreviousModule(): CourseModule | null {
    if (!this.currentModule) return null;
    const currentIndex = this.courseModules.findIndex(m => m.id === this.currentModule!.id);
    if (currentIndex > 0) {
      return this.courseModules[currentIndex - 1];
    }
    return null;
  }

  getNextModule(): CourseModule | null {
    if (!this.currentModule) return null;
    const currentIndex = this.courseModules.findIndex(m => m.id === this.currentModule!.id);
    if (currentIndex < this.courseModules.length - 1) {
      return this.courseModules[currentIndex + 1];
    }
    return null;
  }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  nextSlide() {
    if (this.currentSlideIndex < this.totalSlides - 1) {
      this.currentSlideIndex++;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
