import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Course, Training, TrainingService, CourseModule, LearningPath } from '../../services/training.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css']
})
export class CourseManagementComponent {
  currentUser: any = null;
  isAdmin = false;
  themes: string[] = [];
  courses = signal<{ [theme: string]: Course[] }>({});
  showCourseForm = signal(false);
  editCourseMode = signal(false);
  currentCourse!: Course;
  isSavingCourse = signal(false);
  toastMessage = signal('');

  // Learning Paths
  paths = signal<LearningPath[]>([]);
  showPathForm = signal(false);
  editPathMode = signal(false);
  currentPath!: LearningPath;
  allCourses = signal<Course[]>([]);
  isSavingPath = signal(false);

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

    this.loadCourses();
    this.loadPaths();
    this.currentCourse = this.createEmptyCourse();
    this.currentPath = this.createEmptyPath();
  }

  loadCourses() {
    const coursesByTheme: { [theme: string]: Course[] } = {};
    this.themes.forEach(theme => {
      coursesByTheme[theme] = this.service.getCoursesByTheme(theme);
    });
    this.courses.set(coursesByTheme);
    this.allCourses.set(this.service.getCourses());
  }

  loadPaths() {
    this.paths.set(this.service.getPaths());
  }

  getCoursesForTheme(theme: string): Course[] {
    return this.courses()[theme] || [];
  }

  trackById(index: number, item: Course | LearningPath): string | number {
    return item.id;
  }

  // Course Management
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

  addNewCourse() {
    if (!this.isAdmin) return;
    this.showCourseForm.set(true);
    this.editCourseMode.set(false);
    this.currentCourse = this.createEmptyCourse();
  }

  editCourse(course: Course) {
    if (!this.isAdmin) return;
    this.showCourseForm.set(true);
    this.editCourseMode.set(true);
    this.currentCourse = structuredClone(course);
  }

  deleteCourse(id: string) {
    if (!this.isAdmin) return;
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }
    this.service.deleteCourse(id).subscribe({
      next: () => {
        this.loadCourses();
        this.showToast('Course deleted successfully!');
      },
      error: (err) => this.showToast('Error deleting course: ' + err.message)
    });
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  saveCourse() {
    // Validate required fields
    if (!this.currentCourse.titulo) {
      this.showToast('Title is required.');
      return;
    }

    if (!this.currentCourse.categoria) {
      this.showToast('Category is required.');
      return;
    }

    // Ensure imagem_capa_url is handled even if empty
    if (!this.currentCourse.imagem_capa_url?.trim()) {
      this.currentCourse.imagem_capa_url = '';
    }

    this.isSavingCourse.set(true);
    try {
      console.log('Saving course:', this.currentCourse);
      const action = this.editCourseMode()
        ? this.service.updateCourse(this.currentCourse)
        : this.service.addCourse(this.currentCourse);

      action.subscribe({
        next: () => {
          this.loadCourses();
          this.showToast('Course saved successfully!');
          this.cancelCourse();
          this.isSavingCourse.set(false);
        },
        error: (err) => {
          console.error('Error saving course:', err);
          this.showToast('Error saving course. Please try again.');
          this.isSavingCourse.set(false);
        }
      });
    } catch (error) {
      console.error('Error in saveCourse:', error);
      this.isSavingCourse.set(false);
    }
  }

  cancelCourse() {
    this.showCourseForm.set(false);
    this.currentCourse = this.createEmptyCourse();
  }

  // Learning Path Management
  createEmptyPath(): LearningPath {
    return {
      id: '',
      title: '',
      description: '',
      courses: [],
      progress: 0,
      status: 'Not Started',
      estimatedHours: '',
      image: ''
    };
  }

  addNewPath() {
    if (!this.isAdmin) return;
    this.showPathForm.set(true);
    this.editPathMode.set(false);
    this.currentPath = this.createEmptyPath();
  }

  editPath(path: LearningPath) {
    if (!this.isAdmin) return;
    this.showPathForm.set(true);
    this.editPathMode.set(true);
    this.currentPath = structuredClone(path);
  }

  deletePath(id: string) {
    if (!this.isAdmin) return;
    if (!confirm('Are you sure you want to delete this path?')) {
      return;
    }
    this.service.deletePath(id).subscribe({
      next: () => {
        this.loadPaths();
        this.showToast('Path deleted successfully!');
      },
      error: (err) => this.showToast('Error deleting path: ' + err.message)
    });
  }

  savePath() {
    // Validate required fields
    if (!this.currentPath.title) {
      this.showToast('Title is required.');
      return;
    }

    this.isSavingPath.set(true);
    try {
      console.log('Saving path:', this.currentPath);
      const action = this.editPathMode()
        ? this.service.updatePath(this.currentPath)
        : this.service.addPath(this.currentPath);

      action.subscribe({
        next: () => {
          this.loadPaths();
          this.showToast('Path saved successfully!');
          this.cancelPath();
          this.isSavingPath.set(false);
        },
        error: (err) => {
          console.error('Error saving path:', err);
          this.showToast('Error saving path. Please try again.');
          this.isSavingPath.set(false);
        }
      });
    } catch (error) {
      console.error('Error in savePath:', error);
      this.isSavingPath.set(false);
    }
  }

  cancelPath() {
    this.showPathForm.set(false);
    this.currentPath = this.createEmptyPath();
  }

  toggleCourseSelection(id: string) {
    const selected = this.currentPath.courses.map((c: Course) => c.id);
    if (selected.includes(id)) {
      this.currentPath.courses = this.currentPath.courses.filter((c: Course) => c.id !== id);
    } else {
      const course = this.allCourses().find((c: Course) => c.id === id);
      if (course) this.currentPath.courses.push(course);
    }
  }

  isCourseSelected(id: string): boolean {
    return this.currentPath.courses.some((c: Course) => c.id === id);
  }



  // Module Management
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

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (this.showCourseForm()) {
      this.cancelCourse();
    }
    if (this.showPathForm()) {
      this.cancelPath();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Allow default form submission behavior
    } else if (event.key === 'Escape') {
      this.cancelCourse();
      this.cancelPath();
    }
  }

  onModalClick(event: Event) {
    // Close modal if clicked outside the form content
    if (event.target === event.currentTarget) {
      this.cancelCourse();
      this.cancelPath();
    }
  }
}
