import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TrainingService } from '../../services/training.service';
import { Course, LearningPath } from '../../services/training.service';
import { Usuario } from '../../models/usuario.model';
import { AdminHomeComponent } from "./admin-home/admin-home.component";
import { UserHomeComponent } from "./user-home/user-home.component";

export interface CategorizedCourses {
  category: string;
  courses: Course[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHomeComponent, UserHomeComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private trainingService = inject(TrainingService);

  currentUser: Usuario | null = null;
  searchQuery = '';
  continueCourses: Course[] = [];
  recommendedCourses: Course[] = [];
  categorizedCourses: CategorizedCourses[] = [];
  recommendedPaths: LearningPath[] = [];
  isAdminView = false;

  // Admin dashboard data
  totalCourses = 0;
  totalUsers = 0;
  activeTrainings = 0;
  completionRate = 0;

  categories = ['Soft Skills', 'Leadership', 'Safety', 'Compliance', 'Technical'];

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdminView = this.authService.isAdmin();
    this.loadDashboardData();
    this.loadCourses();
    this.loadRecommendedPaths();
  }

  /**
   * Load dashboard data based on user role
   */
  loadDashboardData() {
    if (this.isAdminView) {
      // Load admin dashboard data
      const allCourses = this.trainingService.getCourses();
      this.totalCourses = allCourses.length;
      this.totalUsers = 124; // Mock data - in a real app this would come from a user service
      this.activeTrainings = allCourses.filter(course => course.status === 'Active').length;
      const totalCompletion = allCourses.reduce((sum, course) => sum + course.completionRate, 0);
      this.completionRate = Math.round(totalCompletion / allCourses.length);
    }
  }

  /**
   * Load courses based on user role
   */
  loadCourses() {
    if (!this.isAdminView) {
      // Load and group courses by category for user view
      const allCourses = this.trainingService.getCourses();

      // Filter courses with progress for "Continue Learning"
      this.continueCourses = allCourses.filter(course => course.completionRate > 0 && course.completionRate < 100);
      
      // Get recommended courses (not started yet)
      this.recommendedCourses = allCourses.filter(course => course.completionRate === 0);
      
      // Group courses by category
      this.categorizedCourses = this.categories.map(category => ({
        category,
        courses: this.recommendedCourses.filter(course => course.categoria === category)
      }));
    }
  }
  
  /**
   * Load recommended learning paths based on user department
   */
  loadRecommendedPaths() {
    if (!this.isAdminView && this.currentUser) {
      this.recommendedPaths = this.trainingService.getRecommendedPathsForDepartment(this.currentUser.department);
    }
  }

  /**
   * Navigate to course viewer with selected course
   */
  onCourseClick(course: Course) {
    this.router.navigate(['/course-viewer'], { queryParams: { courseId: course.id } });
  }
  
  /**
   * Navigate to learning paths page
   */
  navigateToLearningPaths() {
    this.router.navigate(['/learning-paths']);
  }

  /**
   * Scroll carousel left
   */
  scrollLeft(categoryIndex: number): void {
    const carousel = this.getCarouselContainer(categoryIndex);
    if (carousel) {
      carousel.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }

  /**
   * Scroll carousel right
   */
  scrollRight(categoryIndex: number): void {
    const carousel = this.getCarouselContainer(categoryIndex);
    if (carousel) {
      carousel.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }

  /**
   * Check if carousel can scroll left
   */
  canScrollLeft(categoryIndex: number): boolean {
    const carousel = this.getCarouselContainer(categoryIndex);
    return carousel ? carousel.scrollLeft > 0 : false;
  }

  /**
   * Check if carousel can scroll right
   */
  canScrollRight(categoryIndex: number): boolean {
    const carousel = this.getCarouselContainer(categoryIndex);
    if (!carousel) return false;
    return carousel.scrollLeft < (carousel.scrollWidth - carousel.clientWidth);
  }

  /**
   * Get carousel container element
   */
  private getCarouselContainer(categoryIndex: number): HTMLElement | null {
    const section = document.querySelectorAll('.carousel-section')[categoryIndex];
    return section?.querySelector('.carousel-container') as HTMLElement;
  }

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    // TODO: Implement search filtering
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
}