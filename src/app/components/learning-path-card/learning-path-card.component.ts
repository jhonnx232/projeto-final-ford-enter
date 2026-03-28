import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningPath } from '../../services/training.service';

@Component({
  selector: 'app-learning-path-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learning-path-card.component.html',
  styleUrls: ['./learning-path-card.component.css']
})
export class LearningPathCardComponent {
  @Input() learningPath!: LearningPath;
  @Input() isAdmin = false;

  @Output() editPath = new EventEmitter<LearningPath>();
  @Output() deletePath = new EventEmitter<string>();

  onEdit() {
    this.editPath.emit(this.learningPath);
  }

  onDelete() {
    this.deletePath.emit(this.learningPath.id);
  }
}