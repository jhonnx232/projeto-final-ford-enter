import { Component, signal, HostListener, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Course, Training, TrainingService, CourseModule } from '../../services/training.service';

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trainings.component.html',
  styleUrls: ['./trainings.component.css']
})
export class TrainingsComponent implements OnInit {
  currentUser: any = null;
  isAdmin = false;
  themes: string[] = [];
  courses: { [theme: string]: Course[] } = {};
  showForm = signal(false);
  editMode = signal(false);
  currentCourse!: Course;

  // New property for modules modal control
  showModulesModal = signal(false);
  selectedCourse: Course | null = null;
  selectedCourseModules: CourseModule[] = [];

  constructor(private router: Router, private authService: AuthService, private service: TrainingService) {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get current user data
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    this.themes = this.service.themes;

    // Reactively update courses when they are loaded from Supabase
    effect(() => {
      this.updateCourses();
    });
  }

  ngOnInit() {
    this.updateCourses();
    this.currentCourse = this.createEmptyCourse();
  }

  getCoursesForTheme(theme: string): Course[] {
    return this.courses[theme] || [];
  }

  trackById(index: number, item: Course): string {
    return item.id;
  }

  updateCourses() {
    this.themes.forEach(theme => {
      this.courses[theme] = this.service.getCoursesByTheme(theme);
    });
  }

  createEmptyCourse(): Course {
    const course: Course = {
      id: '',
      titulo: '',
      descricao: '',
      carga_horaria_horas: 1,
      preco_avulso: 0,
      imagem_capa_url: '',
      status: 'Active',
      completionRate: 0,
      targetAudience: '',
      categoria: 'Safety',
      courseModules: []
    };
    return course;
  }

  addNew() {
    if (!this.isAdmin) return; // Only admin can add new courses
    this.showForm.set(true);
    this.editMode.set(false);
    this.currentCourse = this.createEmptyCourse();
  }

  editCourse(course: Course) {
    if (!this.isAdmin) return; // Only admin can edit
    this.showForm.set(true);
    this.editMode.set(true);
    this.currentCourse = structuredClone(course);
  }

  deleteCourse(id: string) {
    if (!this.isAdmin) return; // Only admin can delete
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }
    this.service.deleteCourse(id).subscribe({
      next: () => {
        this.updateCourses();
        alert('Course deleted successfully!');
      },
      error: (err) => alert('Error deleting course: ' + err.message)
    });
  }

  saveCourse() {
    try {
      console.log('Attempting to save course:', this.currentCourse);

      // Comprehensive validation of required fields
      if (!this.currentCourse.titulo?.trim()) {
        alert('Course title is required.');
        return;
      }

      if (!this.currentCourse.descricao?.trim()) {
        alert('Course description is required.');
        return;
      }

      if (!this.currentCourse.categoria) {
        alert('Please select a course category.');
        return;
      }

      // Validate duration
      if (!this.currentCourse.carga_horaria_horas || this.currentCourse.carga_horaria_horas <= 0) {
        alert('Valid course duration is required.');
        return;
      }

      // If image is missing, it's okay, service handles placeholder on load
      // But we can also set a default here if we want it saved in DB
      if (!this.currentCourse.imagem_capa_url?.trim()) {
        this.currentCourse.imagem_capa_url = ''; // Let it be empty in DB
      }

      console.log('Validation passed, proceeding with save...');

      if (this.editMode()) {
        // Update existing course
        console.log('Updating existing course with ID:', this.currentCourse.id);
        this.service.updateCourse(this.currentCourse).subscribe({
          next: () => {
            this.updateCourses();
            alert('Course updated successfully!');
            this.cancel();
          },
          error: (err) => alert('Error updating course: ' + err.message)
        });
      } else {
        // Add new course
        console.log('Adding new course:', this.currentCourse);
        this.service.addCourse(this.currentCourse).subscribe({
          next: () => {
            this.updateCourses();
            alert('New course added successfully!');
            this.cancel();
          },
          error: (err) => alert('Error adding course: ' + err.message)
        });
      }

    } catch (error: any) {
      console.error('Error saving course:', error);
      const errorMessage = error?.message ? `Error: ${error.message}` : 'An unexpected error occurred while saving the course.';
      alert(`Save failed. ${errorMessage} Please try again.`);
    }
  }

  cancel() {
    this.showForm.set(false);
    this.currentCourse = this.createEmptyCourse();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: any) {
    if (this.showForm()) {
      this.cancel();
    }
    // Close modules modal with ESC too
    if (this.showModulesModal()) {
      this.closeModulesModal();
    }
  }

  onKeyDown(event: any) {
    if (event.key === 'Enter') {
      // Allow default form submission behavior
    } else if (event.key === 'Escape') {
      this.cancel();
    }
    // Other keys can bubble up for normal behavior
  }

  onModalClick(event: any) {
    // Close modal if clicked outside the form content
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  // New methods for managing modules modal
  openModulesModal(course: Course) {
    this.selectedCourse = course;
    this.selectedCourseModules = [...course.courseModules].sort((a, b) => a.order - b.order);
    this.showModulesModal.set(true);
  }

  closeModulesModal() {
    this.showModulesModal.set(false);
    this.selectedCourse = null;
    this.selectedCourseModules = [];
  }

  getModuleStatus(module: CourseModule): string {
    if (module.isCompleted) {
      return 'Completed';
    }

    // Check if module is locked (if previous modules are not completed)
    const moduleIndex = this.selectedCourseModules.findIndex(m => m.id === module.id);
    for (let i = 0; i < moduleIndex; i++) {
      if (!this.selectedCourseModules[i].isCompleted) {
        return 'Locked';
      }
    }

    return 'Not Started';
  }

  getTotalDuration(courseModules: CourseModule[]): number {
    const totalMinutes = courseModules.reduce((sum, module) => sum + module.duration, 0);
    return +(totalMinutes / 60).toFixed(1); // Convert to hours and round to 1 decimal
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



  addNewModule() {
    const newModule: CourseModule = {
      id: Date.now(),
      title: '',
      type: 'video',
      duration: 30,
      isCompleted: false,
      order: this.currentCourse.courseModules.length + 1
    };
    this.currentCourse.courseModules.push(newModule);
  }

  removeModule(index: number) {
    if (confirm('Are you sure you want to remove this module?')) {
      this.currentCourse.courseModules.splice(index, 1);
      // Re-order remaining modules
      this.currentCourse.courseModules.forEach((module, i) => {
        module.order = i + 1;
      });
    }
  }

  startModule(module: CourseModule) {
    // Navigate to course modules viewer
    this.closeModulesModal();
    this.router.navigate(['/course-viewer'], { queryParams: { courseId: this.selectedCourse?.id } });
  }

  // New method to close modules modal when clicking outside
  onModulesModalClick(event: any) {
    if (event.target === event.currentTarget) {
      this.closeModulesModal();
    }
  }
}
