import { Component, signal, computed, HostListener, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LearningPath, Course, Training, TrainingService } from '../../services/training.service';
import { LearningPathCardComponent } from '../learning-path-card/learning-path-card.component';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-learning-paths',
  standalone: true,
  imports: [CommonModule, FormsModule, LearningPathCardComponent],
  templateUrl: './learning-paths.component.html',
  styleUrls: ['./learning-paths.component.css']
})
export class LearningPathsComponent implements OnInit {
  isAdmin = false;
  showForm = signal(false);
  editMode = signal(false);
  isSaving = signal(false);
  toastMessage = signal('');
  currentUser: Usuario | null = null;

  paths = signal<LearningPath[]>([]);
  allCourses = signal<Course[]>([]);
  currentPath!: LearningPath;

  constructor(private service: TrainingService, private authService: AuthService) {
    this.isAdmin = authService.isAdmin();
    this.currentUser = this.authService.getCurrentUser();

    // Reactively update allCourses when service signals change
    effect(() => {
      this.allCourses.set(this.service.getCourses());
      this.loadPaths(); // Reload paths if courses change
    });
  }

  ngOnInit() {
    this.loadPaths();
  }

  loadPaths() {
    if (this.currentUser) {
      // Load recommended paths based on user's department
      const recommendedPaths = this.service.getRecommendedPathsForDepartment(this.currentUser.department);
      this.paths.set(recommendedPaths);
    } else {
      // Fallback to default paths if no user
      this.paths.set(this.service.getPaths().slice(0, 4));
    }
  }

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

  addNew() {
    if (!this.isAdmin) return; // Only admin can add new paths
    this.showForm.set(true);
    this.editMode.set(false);
    this.currentPath = this.createEmptyPath();
  }

  editPath(path: LearningPath) {
    if (!this.isAdmin) return; // Only admin can edit
    this.showForm.set(true);
    this.editMode.set(true);
    this.currentPath = structuredClone(path);
  }

  deletePath(id: string) {
    if (!this.isAdmin) return; // Only admin can delete
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

  private showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  savePath(form: NgForm) {
    try {
      console.log('Attempting to save path:', this.currentPath);

      // Comprehensive validation
      if (!this.currentPath.title?.trim()) {
        this.showToast('Learning path title is required.');
        return;
      }

      if (!this.currentPath.description?.trim()) {
        this.showToast('Learning path description is required.');
        return;
      }

      // Check if at least one course is selected
      if (!this.currentPath.courses || this.currentPath.courses.length === 0) {
        this.showToast('Please select at least one course for this learning path.');
        return;
      }

      // Validate estimated hours
      if (!this.currentPath.estimatedHours || parseFloat(this.currentPath.estimatedHours) <= 0) {
        this.showToast('Valid estimated hours are required.');
        return;
      }

      console.log('Validation passed, proceeding with save...');

      this.isSaving.set(true);

      // Ensure the selected courses are full objects, not just IDs
      const selectedCourseIds = this.currentPath.courses.map(c => c.id);
      const fullCourses = this.allCourses().filter(course => selectedCourseIds.includes(course.id));

      // Create path data with validated courses
      const pathData: LearningPath = {
        ...this.currentPath,
        courses: fullCourses,
        // Ensure required fields have default values if not provided
        progress: this.currentPath.progress || 0,
        status: this.currentPath.status || 'Not Started'
      };

      const action = this.editMode()
        ? this.service.updatePath(pathData)
        : this.service.addPath(pathData);

      action.subscribe({
        next: () => {
          this.loadPaths();
          const operation = this.editMode() ? 'updated' : 'created';
          this.showToast(`Learning path ${operation} successfully!`);
          this.showForm.set(false);
          this.isSaving.set(false);
          this.cancel();
        },
        error: (err: any) => {
          console.error('Error saving path:', err);
          const errorMessage = err?.message ? `Error: ${err.message}` : 'An unexpected error occurred.';
          this.showToast(`Save failed. ${errorMessage} Please try again.`);
          this.isSaving.set(false);
        }
      });

    } catch (error: any) {
      console.error('Error in savePath:', error);
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.showForm.set(false);
    this.currentPath = this.createEmptyPath();
  }

  toggleCourseSelection(id: string) {
    const selected = this.currentPath.courses.map(c => c.id);
    if (selected.includes(id)) {
      this.currentPath.courses = this.currentPath.courses.filter(c => c.id !== id);
    } else {
      const course = this.allCourses().find(c => c.id === id);
      if (course) this.currentPath.courses.push(course);
    }
  }

  isCourseSelected(id: string): boolean {
    return this.currentPath.courses.some(c => c.id === id);
  }

  trackById(index: number, item: any): string | number {
    return item.id;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: any) {
    if (this.showForm()) {
      this.cancel();
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
}
