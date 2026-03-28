import { Component, OnInit, OnDestroy, inject, HostListener, Renderer2, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TrainingService, Course, LearningPath } from '../../../services/training.service';

export interface CategorizedCourses {
  category: string;
  courses: Course[];
}

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css']
})
export class UserHomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private trainingService = inject(TrainingService);

  currentUser = this.authService.getCurrentUser();
  continueCourses: Course[] = [];
  recommendedCourses: Course[] = [];
  categorizedCourses: CategorizedCourses[] = [];
  recommendedPaths: LearningPath[] = [];
  categories = ['Soft Skills', 'Leadership', 'Safety', 'Compliance', 'Technical'];

  // Carousel properties
  currentIndex = 0;
  totalSlides = 2; // 2 slides with 3 courses each
  slides: any[] = [];
  autoplayInterval: any;
  isPaused = false;

  constructor() {
    // Reactively update courses when they are loaded from Supabase
    effect(() => {
      this.loadCourses();
    });
  }

  // Touch handling
  private touchStartX = 0;
  private touchEndX = 0;

  // Course modules expansion
  private expandedCourseModules = new Set<string>();

  // Computed property for template
  get hasRecommendedCourses(): boolean {
    return this.categorizedCourses.some(cat => cat.courses.length > 0);
  }

  /**
   * Load courses for user view
   */
  loadCourses() {
    const allCourses = this.trainingService.getCourses();

    // Filter courses with progress for "Continue Learning"
    this.continueCourses = allCourses.filter(course =>
      course.completionRate > 0 && course.completionRate < 100
    );

    // Get recommended courses (not started yet) and select 1 from each category
    const recommendedCourses = allCourses.filter(course =>
      course.completionRate === 0
    );

    // Select only 1 course from each category
    this.recommendedCourses = this.categories.map(category => {
      const coursesInCategory = recommendedCourses.filter(course => course.categoria === category);
      // Return first course from each category, or empty if no courses
      return coursesInCategory.length > 0 ? coursesInCategory[0] : null;
    }).filter(course => course !== null) as Course[];

    // Group courses by category (each category will have at most 1 course)
    this.categorizedCourses = this.categories.map(category => ({
      category,
      courses: this.recommendedCourses.filter(course => course.categoria === category)
    }));

    // Load recommended learning paths based on user department
    if (this.currentUser) {
      this.recommendedPaths = this.trainingService.getRecommendedPathsForDepartment(this.currentUser.department);
    }
  }

  /**
   * Navigate to course viewer with selected course
   */
  onCourseClick(course: Course | null) {
    if (course) {
      this.router.navigate(['/course-viewer'], { queryParams: { courseId: course.id } });
    }
  }

  /**
   * Navigate to learning paths page
   */
  navigateToLearningPaths() {
    this.router.navigate(['/learning-paths']);
  }

  /**
   * Navigate to specified path
   */
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  /**
   * Check if a course is new (created within last 7 days)
   */
  isNewCourse(course: Course): boolean {
    // In a real app, this would check the course creation date
    // For now, we'll simulate with a simple condition
    return course.id.length > 20; // Simulate new courses with UUIDs
  }

  /**
   * Check if a course is popular (high enrollment or completion)
   */
  isPopularCourse(course: Course): boolean {
    // In a real app, this would check enrollment or completion data
    // For now, we'll simulate with a simple condition
    return course.completionRate > 70; // Simulate popular courses
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByFn(index: number, item: any): any {
    return item.id;
  }

  ngOnInit() {
    this.loadCourses();
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  // Carousel methods
  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, 5000); // Change slide every 5 seconds
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
  }

  goToSlide(index: number) {
    this.currentIndex = index;
  }

  onMouseEnter() {
    this.isPaused = true;
  }

  onMouseLeave() {
    this.isPaused = false;
  }

  // Touch event handlers
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
    this.stopAutoplay();
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
    this.startAutoplay(); // Restart autoplay after swipe
  }

  private handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = this.touchStartX - this.touchEndX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        this.nextSlide(); // Swipe left - next
      } else {
        this.prevSlide(); // Swipe right - prev
      }
    }
  }

  // Course modules expansion
  toggleCourseModules(courseId: string) {
    // Allow only one card to be expanded at a time
    if (this.expandedCourseModules.has(courseId)) {
      // If clicking on the same card, close it
      this.expandedCourseModules.delete(courseId);
    } else {
      // Close any currently expanded card and open the clicked one
      this.expandedCourseModules.clear();
      this.expandedCourseModules.add(courseId);
    }
  }

  isCourseModulesExpanded(courseId: string): boolean {
    return this.expandedCourseModules.has(courseId);
  }

  getCourseModules(courseId: string): any[] {
    const allCourses = this.trainingService.getCourses();
    const course = allCourses.find(c => c.id === courseId);
    return course?.courseModules || [];
  }

  getModuleTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'video': 'Video',
      'quiz': 'Quiz',
      'reading': 'Reading',
      'assignment': 'Assignment',
      'presentation': 'Presentation'
    };
    return labels[type] || 'Content';
  }

  /**
   * Check if a module is locked (previous modules not completed)
   */
  isModuleLocked(courseId: string, module: any): boolean {
    const modules = this.getCourseModules(courseId);
    if (modules.length === 0) return false;

    const moduleIndex = modules.findIndex(m => m.id === module.id);
    if (moduleIndex <= 0) return false; // First module is never locked

    // Check if any previous module is not completed
    for (let i = 0; i < moduleIndex; i++) {
      if (!modules[i].isCompleted) {
        return true;
      }
    }
    return false;
  }

  /**
   * TrackBy function for modules
   */
  trackByModuleId(index: number, item: any): number {
    return item.id;
  }

  /**
   * TrackBy function for categories
   */
  trackByCategory(index: number, item: CategorizedCourses): string {
    return item.category;
  }

  /**
   * TrackBy function for learning paths
   */
  trackByPathId(index: number, item: LearningPath): string | number {
    return item.id;
  }
}
