import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Training, LearningPath, TrainingService } from '../../services/training.service'; // Ajuste path

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  private service = inject(TrainingService);

  isAdmin = true;
  filterPeriod = signal<'week' | 'month'>('month');

  // Opções de período para o filtro
  periodOptions = ['week', 'month'];

  trainings: Training[] = [];
  paths: LearningPath[] = [];

  // KPIs calculados
  totalTrainings = signal(0);
  completedTrainings = signal(0);
  completionRate = signal(0);
  activePaths = signal(0);

  // Dados para gráficos
  barChartData = signal<any[]>([]);
  pieChartData = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.trainings = this.service.getTrainings();
    this.paths = this.service.getPaths();

    // KPIs
    this.totalTrainings.set(this.trainings.length);
    this.completedTrainings.set(this.trainings.filter(t => t.status === 'Completed').length);
    this.completionRate.set(this.totalTrainings() > 0 ? (this.completedTrainings() / this.totalTrainings()) * 100 : 0);
    this.activePaths.set(this.paths.filter(p => p.status === 'In Progress').length);

    // Bar chart: Progresso por categoria
    const themeProgress: { [key: string]: { total: number, completed: number } } = {};
    this.service.themes.forEach(theme => themeProgress[theme] = { total: 0, completed: 0 });

    const allCourses = this.service.getCourses();
    allCourses.forEach(course => {
      if (themeProgress[course.categoria]) {
        themeProgress[course.categoria].total += 100;
        themeProgress[course.categoria].completed += course.completionRate;
      }
    });

    const barData = this.service.themes.map(theme => ({
      name: theme,
      value: themeProgress[theme].total > 0
        ? Math.round(themeProgress[theme].completed / (themeProgress[theme].total / 100))
        : 0
    }));

    this.barChartData.set(barData);

    // Pie chart: Trainings vs Paths
    this.pieChartData.set([
      { name: 'Trainings', value: this.totalTrainings() },
      { name: 'Paths', value: this.paths.length }
    ]);
  }

  setPeriod(period: string) {
    // Converter string para tipo específico
    const periodType = period as 'week' | 'month';
    this.filterPeriod.set(periodType);
    // Lógica para filtrar dados por período (simplificada)
    this.loadData(); // Recarrega com filtro
  }

  exportCSV() {
    // Simples export (use uma lib como PapaParse para produção)
    const csv = 'Training,Status,Completion\n' + this.trainings.map(t => `${t.title},${t.status},${t.status === 'Completed' ? 100 : 0}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ford-reports.csv';
    a.click();
  }

  trackByFn(index: number, item: any): any {
    return item.name || index;
  }
}
