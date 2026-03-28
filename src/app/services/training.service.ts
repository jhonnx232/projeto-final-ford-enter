import { Injectable, signal } from '@angular/core';
import { Observable, from, map, catchError, throwError, tap, switchMap } from 'rxjs';
import { SupabaseService } from './supabase/supabase.service';
import { ImageUtils } from '../utils/image.utils';

export interface Training {
  id: string; // uuid
  title: string;
  description?: string;
  duration?: string;
  image?: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
}

export interface LearningPath {
  id: string; // uuid
  title: string;
  description?: string;
  estimatedHours?: string;
  image?: string;
  courses: Course[];
  progress: number;
  status: 'In Progress' | 'Completed' | 'Not Started';
}

export interface CourseModule {
  id: number;
  title: string;
  type: 'video' | 'quiz' | 'reading' | 'assignment' | 'presentation';
  duration: number; // in minutes
  url?: string; // for external links
  content?: string; // for text content
  isCompleted: boolean;
  order: number;
}

export interface Course {
  id: string; // uuid from Supabase
  titulo: string;
  descricao: string;
  categoria: string;
  carga_horaria_horas: number;
  preco_avulso: number;
  imagem_capa_url: string;
  // Optional frontend-only fields or legacy fields if still needed
  status?: 'Active' | 'Upcoming';
  completionRate: number; // percentage, 0-100
  targetAudience?: string;
  courseModules: CourseModule[];
}

@Injectable({
  providedIn: 'root'
})
export class TrainingService {

  constructor(private supabaseService: SupabaseService) {
    this.syncWithSupabase();
  }

  trainings = signal<Training[]>([]);
  paths = signal<LearningPath[]>([]);
  courses = signal<Course[]>([]);
  themes: string[] = ['Safety', 'Leadership', 'Compliance', 'Soft Skills', 'Technical'];

  private syncWithSupabase() {
    this.loadCoursesFromSupabase().subscribe({
      next: courses => {
        if (courses && courses.length > 0) {
          this.courses.set(courses);
        }
      },
      error: error => {
        console.warn('Could not load courses from Supabase.', error);
      }
    });

    this.loadPathsFromSupabase().subscribe({
      next: paths => {
        if (paths && paths.length > 0) {
          this.paths.set(paths);
        }
      },
      error: error => {
        console.warn('Could not load learning paths from Supabase.', error);
      }
    });

    this.loadTrainingsFromSupabase().subscribe({
      next: trainings => {
        if (trainings && trainings.length > 0) {
          this.trainings.set(trainings);
        }
      },
      error: error => {
        console.warn('Could not load matriculas from Supabase.', error);
      }
    });
  }

  // Method to fetch trainings from Supabase
  loadTrainingsFromSupabase(): Observable<Training[]> {
    return from(
      this.supabaseService.supabase
        .from('matriculas')
        .select('*')
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }
        return response.data || [];
      }),
      catchError((error) => {
        console.error('Error fetching matriculas from Supabase:', error);
        return throwError(() => error);
      })
    );
  }

  loadCoursesFromSupabase(): Observable<Course[]> {
    return from(
      this.supabaseService.supabase
        .from('cursos')
        .select('*, curso_modulos(*)')
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }
        const courses: Course[] = (response.data || []).map((course: any) => ({
          ...course,
          courseModules: course.curso_modulos || [],
          // Map database fields to interface and provide placeholder if imagem_capa_url is null
          imagem_capa_url: course.imagem_capa_url || ImageUtils.generatePlaceholderImage(course.titulo, course.categoria),
          completionRate: course.completionRate || 0
        }));
        return courses;
      }),
      catchError((error) => {
        console.error('Error fetching cursos from Supabase:', error);
        return throwError(() => error);
      })
    );
  }

  loadPathsFromSupabase(): Observable<LearningPath[]> {
    return from(
      this.supabaseService.supabase
        .from('trilhas')
        .select('*, cursos(*)')
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }
        const paths: LearningPath[] = (response.data || []).map((path: any) => ({
          ...path,
          courses: (path.cursos || []).map((c: any) => ({
            ...c,
            courseModules: c.curso_modulos || []
          }))
        }));
        return paths;
      }),
      catchError((error) => {
        console.error('Error fetching trilhas from Supabase:', error);
        return throwError(() => error);
      })
    );
  }

  getTrainings(): Training[] { return this.trainings(); }
  getPaths(): LearningPath[] { return this.paths(); }
  getCourses(): Course[] { return this.courses(); }
  getCoursesByTheme(theme: string): Course[] {
    return this.courses().filter(course => course.categoria === theme);
  }

  /**
   * Get the onboarding path for new users
   * This simulates fetching the onboarding path from the backend
   */
  getOnboardingPath(): LearningPath | undefined {
    return this.paths().find(path => path.title === 'Onboarding Path');
  }

  /**
   * Get recommended learning paths based on user department/position
   * @param department - User's department or position
   */
  getRecommendedPathsForDepartment(department: string | undefined): LearningPath[] {
    const allPaths = this.getPaths();
    const allCourses = this.getCourses();

    if (!department) {
      // If no department specified, return general paths
      return allPaths.slice(0, 3);
    }

    // Map departments to relevant themes (now using 'categoria')
    const departmentThemeMap: { [key: string]: string[] } = {
      'management': ['Leadership', 'Project Management', 'Soft Skills'],
      'it': ['Technical', 'Cybersecurity', 'Cloud Computing'],
      'hr': ['Soft Skills', 'Compliance', 'Leadership'],
      'sales': ['Soft Skills', 'Sales', 'Customer Service'],
      'operations': ['Safety', 'Technical', 'Compliance'],
      'finance': ['Compliance', 'Technical', 'Soft Skills'],
      'marketing': ['Soft Skills', 'Customer Service', 'Technical'],
      'admin': ['Soft Skills', 'Compliance', 'Technical'],
      'engineering': ['Technical', 'Safety', 'Project Management'],
      'customer service': ['Customer Service', 'Soft Skills', 'Compliance'],
      'legal': ['Compliance', 'Soft Skills', 'Leadership'],
      'quality': ['Safety', 'Compliance', 'Technical'],
      'production': ['Safety', 'Technical', 'Operations'],
      'logistics': ['Operations', 'Technical', 'Soft Skills'],
      'research': ['Technical', 'Research', 'Innovation'],
      'design': ['Technical', 'Creativity', 'Soft Skills']
    };

    // Normalize department name for matching
    const normalizedDepartment = department.toLowerCase();
    let relevantThemes: string[] = [];

    // Find matching themes for department
    for (const [dept, themes] of Object.entries(departmentThemeMap)) {
      if (normalizedDepartment.includes(dept)) {
        relevantThemes = themes;
        break;
      }
    }

    // If no specific match, use general themes
    if (relevantThemes.length === 0) {
      relevantThemes = ['Soft Skills', 'Technical'];
    }

    // Filter and create recommended paths
    const recommendedPaths: LearningPath[] = [];

    // Create a path for each relevant theme
    relevantThemes.forEach((theme, index) => {
      const themeCourses = allCourses.filter(course =>
        course.categoria.toLowerCase().includes(theme.toLowerCase()) ||
        theme.toLowerCase().includes(course.categoria.toLowerCase())
      );

      if (themeCourses.length > 0) {
        const path: LearningPath = {
          id: (100 + index).toString(), // Unique ID for recommended paths
          title: `${theme} Development Path`,
          description: `Recommended learning path for ${department} professionals focusing on ${theme} skills`,
          estimatedHours: `${Math.round(themeCourses.slice(0, 3).reduce((sum, course) => sum + course.carga_horaria_horas, 0))}h`,
          image: this.getPathImageForTheme(theme),
          courses: themeCourses.slice(0, 3), // Limit to 3 courses per path
          progress: Math.round(Math.random() * 100), // Mock progress
          status: this.getPathStatus(Math.random() * 100)
        };
        recommendedPaths.push(path);
      }
    });

    // If no theme-based paths were created, create a general one
    if (recommendedPaths.length === 0) {
      const generalPath: LearningPath = {
        id: '999',
        title: 'General Professional Development',
        description: 'General learning path for all professionals',
        estimatedHours: '10h',
        image: 'general-path.jpg',
        courses: allCourses.slice(0, 4),
        progress: Math.round(Math.random() * 100),
        status: this.getPathStatus(Math.random() * 100)
      };
      recommendedPaths.push(generalPath);
    }

    // Limit to 4 paths maximum
    return recommendedPaths.slice(0, 4);
  }

  /**
   * Get path status based on progress
   * @param progress - Progress value between 0 and 100
   */
  private getPathStatus(progress: number): 'In Progress' | 'Completed' | 'Not Started' {
    if (progress >= 100) return 'Completed';
    if (progress > 0) return 'In Progress';
    return 'Not Started';
  }

  /**
   * Get appropriate image for theme
   * @param theme - Learning theme
   */
  private getPathImageForTheme(theme: string): string {
    const themeImageMap: { [key: string]: string } = {
      'leadership': 'Leadership Development.png',
      'technical': 'Technical Skills.png',
      'soft skills': 'Soft Skills.jpg',
      'safety': 'Safety Training.jpg',
      'compliance': 'Compliance and Ethics.jpg',
      'sales': 'Sales Training.jpg',
      'project management': 'Project Management.jpg',
      'customer service': 'Customer Service Excellence.jpg',
      'cybersecurity': 'cyber.jpg',
      'cloud computing': 'cloud.jpg',
      'creativity': 'final_left_side_right_side_brain_visual.jpg',
      'innovation': 'Automation-and-Robotics.jpeg',
      'operations': 'project-management.jpg',
      'research': 'excel.png'
    };

    const normalizedTheme = theme.toLowerCase();
    return themeImageMap[normalizedTheme] || 'general-path.jpg';
  }

  // Métodos para Trainings (Matrículas)
  addTraining(training: Training): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('matriculas')
        .insert(training)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.trainings.update(t => [...t, training]);
        }
      }),
      catchError(err => {
        console.error('Error adding matricula to Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  updateTraining(updated: Training): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('matriculas')
        .update({
          title: updated.title,
          description: updated.description,
          duration: updated.duration,
          image: updated.image,
          status: updated.status
        })
        .eq('id', updated.id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.trainings.update(t => t.map(tr => tr.id === updated.id ? updated : tr));
        }
      }),
      catchError(err => {
        console.error('Error updating matricula in Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  deleteTraining(id: string): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('matriculas')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.trainings.update(t => t.filter(tr => tr.id !== id));
        }
      }),
      catchError(err => {
        console.error('Error deleting matricula from Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  // Métodos para Trilhas
  addPath(path: LearningPath): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('trilhas')
        .insert({
          id: path.id,
          title: path.title,
          description: path.description,
          estimatedHours: path.estimatedHours,
          image: path.image,
          progress: path.progress,
          status: path.status
        })
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.paths.update(p => [...p, path]);
        }
      }),
      catchError(err => {
        console.error('Error adding trilha to Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  updatePath(updated: LearningPath): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('trilhas')
        .update({
          title: updated.title,
          description: updated.description,
          estimatedHours: updated.estimatedHours,
          image: updated.image,
          progress: updated.progress,
          status: updated.status
        })
        .eq('id', updated.id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.paths.update(p => p.map(pth => pth.id === updated.id ? updated : pth));
        }
      }),
      catchError(err => {
        console.error('Error updating trilha in Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  deletePath(id: string): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('trilhas')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.paths.update(p => p.filter(pth => pth.id !== id));
        }
      }),
      catchError(err => {
        console.error('Error deleting trilha from Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  // Métodos para Cursos
  addCourse(course: Course): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('cursos')
        .insert({
          titulo: course.titulo,
          descricao: course.descricao,
          categoria: course.categoria,
          carga_horaria_horas: course.carga_horaria_horas,
          preco_avulso: course.preco_avulso,
          imagem_capa_url: course.imagem_capa_url
        })
        .select()
    ).pipe(
      switchMap((response: any) => {
        if (response.error) throw response.error;
        const newCourse = response.data[0];

        if (course.courseModules && course.courseModules.length > 0) {
          const modulesToInsert = course.courseModules.map(m => ({
            ...m,
            curso_id: newCourse.id
          }));
          return from(
            this.supabaseService.supabase
              .from('curso_modulos')
              .insert(modulesToInsert)
          ).pipe(map(() => ({ ...newCourse, courseModules: course.courseModules })));
        }
        return from([{ ...newCourse, courseModules: [] }]);
      }),
      tap((newCourse: Course) => {
        this.courses.update(c => [...c, newCourse]);
      }),
      catchError(err => {
        console.error('Error adding curso to Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  updateCourse(updated: Course): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('cursos')
        .update({
          titulo: updated.titulo,
          descricao: updated.descricao,
          categoria: updated.categoria,
          carga_horaria_horas: updated.carga_horaria_horas,
          preco_avulso: updated.preco_avulso,
          imagem_capa_url: updated.imagem_capa_url
        })
        .eq('id', updated.id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.courses.update(c => c.map(course => course.id === updated.id ? updated : course));
        }
      }),
      catchError(err => {
        console.error('Error updating curso in Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  updateModule(courseId: string, updatedModule: CourseModule): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('curso_modulos')
        .update({
          title: updatedModule.title,
          type: updatedModule.type,
          duration: updatedModule.duration,
          url: updatedModule.url,
          content: updatedModule.content,
          isCompleted: updatedModule.isCompleted,
          order: updatedModule.order
        })
        .eq('id', updatedModule.id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.courses.update(c => c.map(course => {
            if (course.id === courseId) {
              course.courseModules = course.courseModules.map(m => m.id === updatedModule.id ? updatedModule : m);
            }
            return course;
          }));
        }
      }),
      catchError(err => {
        console.error('Error updating modulo in Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  deleteCourse(id: string): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('cursos')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.courses.update(c => c.filter(course => course.id !== id));
        }
      }),
      catchError(err => {
        console.error('Error deleting curso from Supabase:', err);
        return throwError(() => err);
      })
    );
  }

  // Métodos para Empresas
  loadEmpresas(): Observable<any[]> {
    return from(
      this.supabaseService.supabase
        .from('empresas')
        .select('*')
    ).pipe(
      map(res => res.data || []),
      catchError(err => {
        console.error('Error loading empresas:', err);
        return throwError(() => err);
      })
    );
  }

  // Métodos para Certificados
  loadCertificados(usuarioId: string): Observable<any[]> {
    return from(
      this.supabaseService.supabase
        .from('certificados')
        .select('*')
        .eq('usuario_id', usuarioId)
    ).pipe(
      map(res => res.data || []),
      catchError(err => {
        console.error('Error loading certificados:', err);
        return throwError(() => err);
      })
    );
  }

  gerarCertificado(certificado: any) {
    return from(
      this.supabaseService.supabase
        .from('certificados')
        .insert(certificado)
    ).pipe(
      catchError(err => {
        console.error('Error generating certificado:', err);
        return throwError(() => err);
      })
    );
  }
}
