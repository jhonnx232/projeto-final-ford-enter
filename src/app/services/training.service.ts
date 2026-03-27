import { Injectable, signal } from '@angular/core';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from './supabase/supabase.service';
import { ImageUtils } from '../utils/image.utils';

export interface Training {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  image?: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
}

export interface LearningPath {
  id: number;
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
  id: number;
  title: string;
  description: string;
  duration: number; // calculated dynamically from modules in minutes -> hours
  modules: number; // calculated as courseModules.length
  image: string;
  status: 'Active' | 'Upcoming';
  completionRate: number; // percentage, 0-100
  targetAudience: string;
  theme: string;
  courseModules: CourseModule[];
}

@Injectable({
  providedIn: 'root'
})
export class TrainingService {

  constructor(private supabaseService: SupabaseService) {
    this.syncWithSupabase();
  }

  trainings = signal<Training[]>([
    { id: 1, title: 'Workplace Safety', description: 'Basic safety procedures.', duration: '2h', image: ImageUtils.generatePlaceholderImage('Workplace Safety', 'Safety'), status: 'Completed' },
    { id: 2, title: 'Corporate Compliance', description: 'Company rules.', duration: '1.5h', image: ImageUtils.generatePlaceholderImage('Corporate Compliance', 'Compliance'), status: 'In Progress' },
    { id: 3, title: 'Leadership Essentials', description: 'Team motivation.', duration: '3h', image: ImageUtils.generatePlaceholderImage('Leadership Essentials', 'Leadership'), status: 'Not Started' }
  ]);

  private syncWithSupabase() {
    this.loadCoursesFromSupabase().subscribe({
      next: courses => {
        if (courses && courses.length > 0) {
          this.courses.set(courses);
        }
      },
      error: error => {
        console.warn('Could not load courses from Supabase, using fallback data.', error);
      }
    });

    this.loadPathsFromSupabase().subscribe({
      next: paths => {
        if (paths && paths.length > 0) {
          this.paths.set(paths);
        }
      },
      error: error => {
        console.warn('Could not load learning paths from Supabase, using fallback data.', error);
      }
    });

    this.loadTrainingsFromSupabase().subscribe({
      next: trainings => {
        if (trainings && trainings.length > 0) {
          this.trainings.set(trainings);
        }
      },
      error: error => {
        console.warn('Could not load trainings from Supabase, using fallback data.', error);
      }
    });
  }

  // Method to fetch trainings from Supabase
  loadTrainingsFromSupabase(): Observable<Training[]> {
    return from(
      this.supabaseService.supabase
        .from('trainings')
        .select('*')
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }
        return response.data || [];
      }),
      catchError((error) => {
        console.error('Error fetching trainings from Supabase:', error);
        return throwError(() => error);
      })
    );
  }

  loadCoursesFromSupabase(): Observable<Course[]> {
    return from(
      this.supabaseService.supabase
        .from('courses')
        .select('*, course_modules(*)')
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }
        const courses: Course[] = (response.data || []).map((course: any) => ({
          ...course,
          courseModules: course.course_modules || []
        }));
        return courses;
      }),
      catchError((error) => {
        console.error('Error fetching courses from Supabase:', error);
        return throwError(() => error);
      })
    );
  }

  loadPathsFromSupabase(): Observable<LearningPath[]> {
    return from(
      this.supabaseService.supabase
        .from('learning_paths')
        .select('*, courses(*)')
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }
        const paths: LearningPath[] = (response.data || []).map((path: any) => ({
          ...path,
          courses: path.courses || []
        }));
        return paths;
      }),
      catchError((error) => {
        console.error('Error fetching learning paths from Supabase:', error);
        return throwError(() => error);
      })
    );
  }

  paths = signal<LearningPath[]>([
    {
      id: 1,
      title: 'Onboarding Path',
      description: 'Introduction for new employees.',
      estimatedHours: '3.5h',
      image: 'welcome.jpg',
      courses: [], // Will be populated after courses are loaded
      progress: 50,
      status: 'In Progress'
    },
    {
      id: 2,
      title: 'Sales Training',
      description: 'Master the art of sales.',
      estimatedHours: '4.0h',
      image: 'Sales Training.jpg',
      courses: [],
      progress: 30,
      status: 'In Progress'
    },
    {
      id: 3,
      title: 'Leadership Development',
      description: 'Become a better leader.',
      estimatedHours: '6.0h',
      image: 'Leadership Development.png',
      courses: [],
      progress: 75,
      status: 'In Progress'
    },
    {
      id: 4,
      title: 'Technical Skills',
      description: 'Learn essential technical skills.',
      estimatedHours: '5.5h',
      image: 'Technical Skills.png',
      courses: [],
      progress: 90,
      status: 'Completed'
    },
    {
      id: 5,
      title: 'Compliance and Ethics',
      description: 'Understand company policies.',
      estimatedHours: '2.0h',
      image: 'Compliance and Ethics.jpg',
      courses: [],
      progress: 100,
      status: 'Completed'
    },
    {
      id: 6,
      title: 'Project Management',
      description: 'Manage projects effectively.',
      estimatedHours: '5.0h',
      image: 'Project Management.jpg',
      courses: [],
      progress: 20,
      status: 'Not Started'
    },
    {
      id: 7,
      title: 'Customer Service Excellence',
      description: 'Provide outstanding customer service.',
      estimatedHours: '3.0h',
      image: 'Customer Service Excellence.jpg',
      courses: [],
      progress: 60,
      status: 'In Progress'
    }
  ]);

  themes: string[] = ['Safety', 'Leadership', 'Compliance', 'Soft Skills', 'Technical'];

  courses = signal<Course[]>([
    // Safety - Progress: 50% (2 de 4 módulos completados) - 15+10+20+15=60 min = 1.0h
    { id: 1, title: 'Workplace Hazard Recognition', description: 'Identify and mitigate workplace hazards.', duration: 1.0, modules: 4, image: 'workplace-hazard-identification.jpg', status: 'Active', completionRate: 50, targetAudience: 'All employees', theme: 'Safety', courseModules: [
      { id: 1, title: 'Introduction to Workplace Hazards', type: 'video', duration: 15, isCompleted: true, order: 1 },
      { id: 2, title: 'Identifying Common Hazards', type: 'quiz', duration: 10, isCompleted: true, order: 2 },
      { id: 3, title: 'Risk Assessment Procedures', type: 'presentation', duration: 20, isCompleted: false, order: 3 },
      { id: 4, title: 'Hazard Mitigation Strategies', type: 'assignment', duration: 15, isCompleted: false, order: 4 }
    ] },
    // Safety - 100% progress (all 3 modules completed)
    { id: 2, title: 'Emergency Response Procedures', description: 'Procedures for emergency situations.', duration: 1.5, modules: 3, image: 'emergencyprocedures.jpg', status: 'Active', completionRate: 100, targetAudience: 'All employees', theme: 'Safety', courseModules: [
      { id: 5, title: 'Emergency Evacuation Protocols', type: 'video', duration: 20, isCompleted: true, order: 1 },
      { id: 6, title: 'First Aid Basics', type: 'presentation', duration: 15, isCompleted: true, order: 2 },
      { id: 7, title: 'Emergency Drills Practice', type: 'quiz', duration: 10, isCompleted: true, order: 3 }
    ] },
    // Safety - 20% progress (1 de 5 módulos completado)
    { id: 3, title: 'Safety Equipment Training', description: 'Proper use of safety gear.', duration: 3, modules: 5, image: 'Safety Equipment Training.jpg', status: 'Active', completionRate: 20, targetAudience: 'Production staff', theme: 'Safety', courseModules: [
      { id: 8, title: 'PPE Overview and Types', type: 'video', duration: 25, isCompleted: true, order: 1 },
      { id: 9, title: 'Helmet and Head Protection', type: 'presentation', duration: 15, isCompleted: false, order: 2 },
      { id: 10, title: 'Hand and Foot Protection', type: 'video', duration: 20, isCompleted: false, order: 3 },
      { id: 11, title: 'Respiratory Protection', type: 'quiz', duration: 15, isCompleted: false, order: 4 },
      { id: 12, title: 'Equipment Maintenance', type: 'assignment', duration: 10, isCompleted: false, order: 5 }
    ] },
    { id: 4, title: 'Fire Safety and Prevention', description: 'Fire prevention and response.', duration: 2.5, modules: 4, image: 'fire safety.png', status: 'Upcoming', completionRate: 0, targetAudience: 'All employees', theme: 'Safety', courseModules: [
      { id: 13, title: 'Fire Safety Fundamentals', type: 'video', duration: 20, isCompleted: false, order: 1 },
      { id: 14, title: 'Fire Extinguisher Use', type: 'presentation', duration: 15, isCompleted: false, order: 2 },
      { id: 15, title: 'Fire Prevention Measures', type: 'reading', duration: 10, isCompleted: false, order: 3 },
      { id: 16, title: 'Fire Response Drill', type: 'quiz', duration: 15, isCompleted: false, order: 4 }
    ] },
    { id: 5, title: 'Ergonomics in the Workplace', description: 'Prevent injuries with proper ergonomics.', duration: 1, modules: 2, image: 'Workplace-Ergonomics.jpg', status: 'Active', completionRate: 60, targetAudience: 'Office employees', theme: 'Safety', courseModules: [
      { id: 17, title: 'Understanding Ergonomics', type: 'video', duration: 20, isCompleted: true, order: 1 },
      { id: 18, title: 'Setting Up Your Workstation', type: 'presentation', duration: 15, isCompleted: false, order: 2 }
    ] },
    // Leadership - 50% progress (3 de 6 módulos completados)
    { id: 6, title: 'Effective Communication Skills', description: 'Improve team communication.', duration: 4, modules: 6, image: 'Effective Communication Skills.jpeg', status: 'Active', completionRate: 50, targetAudience: 'Managers and supervisors', theme: 'Leadership', courseModules: [
      { id: 19, title: 'Active Listening Techniques', type: 'video', duration: 20, isCompleted: true, order: 1 },
      { id: 20, title: 'Written Communication Best Practices', type: 'presentation', duration: 25, isCompleted: true, order: 2 },
      { id: 21, title: 'Feedback Delivery Methods', type: 'quiz', duration: 15, isCompleted: true, order: 3 },
      { id: 22, title: 'Presentation Skills for Leaders', type: 'video', duration: 30, isCompleted: false, order: 4 },
      { id: 23, title: 'Digital Communication Tools', type: 'presentation', duration: 20, isCompleted: false, order: 5 },
      { id: 24, title: 'Communication Exercise', type: 'assignment', duration: 15, isCompleted: false, order: 6 }
    ] },
    // Leadership - 100% progress (all 4 modules completed)
    { id: 7, title: 'Conflict Resolution', description: 'Strategies for resolving workplace conflicts.', duration: 3, modules: 4, image: 'conflict-resolution.jpg', status: 'Active', completionRate: 100, targetAudience: 'Managers and supervisors', theme: 'Leadership', courseModules: [
      { id: 25, title: 'Understanding Conflict Types', type: 'video', duration: 20, isCompleted: true, order: 1 },
      { id: 26, title: 'Conflict Resolution Techniques', type: 'presentation', duration: 25, isCompleted: true, order: 2 },
      { id: 27, title: 'Mediation Skills Practice', type: 'quiz', duration: 10, isCompleted: true, order: 3 },
      { id: 28, title: 'Preventing Future Conflicts', type: 'presentation', duration: 15, isCompleted: true, order: 4 }
    ] },
    { id: 8, title: 'Team Building and Motivation', description: 'Build and motivate high-performing teams.', duration: 5, modules: 7, image: 'motivation.jpg', status: 'Upcoming', completionRate: 0, targetAudience: 'Leaders and team leads', theme: 'Leadership', courseModules: [
      { id: 29, title: 'Team Dynamics Overview', type: 'video', duration: 25, isCompleted: false, order: 1 },
      { id: 30, title: 'Building Trust in Teams', type: 'presentation', duration: 20, isCompleted: false, order: 2 },
      { id: 31, title: 'Motivation Theory', type: 'reading', duration: 15, isCompleted: false, order: 3 },
      { id: 32, title: 'Recognizing Achievements', type: 'assignment', duration: 20, isCompleted: false, order: 4 },
      { id: 33, title: 'Team Building Activities', type: 'video', duration: 30, isCompleted: false, order: 5 },
      { id: 34, title: 'Performance Evaluation Skills', type: 'quiz', duration: 15, isCompleted: false, order: 6 },
      { id: 35, title: 'Action Plan Development', type: 'presentation', duration: 25, isCompleted: false, order: 7 }
    ] },
    { id: 9, title: 'Change Management', description: 'Lead through organizational change.', duration: 4.5, modules: 6, image: 'Change.jpg', status: 'Active', completionRate: 55, targetAudience: 'Senior leaders', theme: 'Leadership', courseModules: [
      { id: 36, title: 'Understanding Change', type: 'video', duration: 25, isCompleted: true, order: 1 },
      { id: 37, title: 'Communication During Change', type: 'presentation', duration: 20, isCompleted: false, order: 2 },
      { id: 38, title: 'Overcoming Resistance', type: 'presentation', duration: 15, isCompleted: false, order: 3 },
      { id: 39, title: 'Change Implementation Strategies', type: 'reading', duration: 20, isCompleted: false, order: 4 },
      { id: 40, title: 'Measuring Change Impact', type: 'quiz', duration: 10, isCompleted: false, order: 5 },
      { id: 41, title: 'Sustaining Change', type: 'assignment', duration: 25, isCompleted: false, order: 6 }
    ] },
    { id: 10, title: 'Decision Making Processes', description: 'Enhance decision-making skills.', duration: 3.5, modules: 5, image: 'decision.jpg', status: 'Active', completionRate: 67, targetAudience: 'Managers', theme: 'Leadership', courseModules: [
      { id: 42, title: 'Decision Making Models', type: 'video', duration: 20, isCompleted: true, order: 1 },
      { id: 43, title: 'Risk Assessment in Decisions', type: 'presentation', duration: 15, isCompleted: false, order: 2 },
      { id: 44, title: 'Group Decision Making', type: 'quiz', duration: 12, isCompleted: false, order: 3 },
      { id: 45, title: 'Data-Driven Decisions', type: 'reading', duration: 18, isCompleted: false, order: 4 },
      { id: 46, title: 'Practical Application', type: 'assignment', duration: 15, isCompleted: false, order: 5 }
    ] },
    // Compliance
    { id: 11, title: 'Anti-Harassment Training', description: 'Understand and prevent harassment.', duration: 2, modules: 3, image: 'anti-Harassment.jpg', status: 'Active', completionRate: 94, targetAudience: 'All employees', theme: 'Compliance', courseModules: [
      { id: 47, title: 'Harassment Types and Recognition', type: 'video', duration: 18, isCompleted: true, order: 1 },
      { id: 48, title: 'Reporting Procedures', type: 'presentation', duration: 15, isCompleted: true, order: 2 },
      { id: 49, title: 'Creating Safe Workplace', type: 'quiz', duration: 10, isCompleted: true, order: 3 }
    ] },
    { id: 12, title: 'Data Privacy and Protection', description: 'GDPR and data protection rules.', duration: 3.5, modules: 5, image: 'data.jpg', status: 'Active', completionRate: 79, targetAudience: 'All employees', theme: 'Compliance', courseModules: [
      { id: 50, title: 'GDPR Principles Overview', type: 'video', duration: 25, isCompleted: true, order: 1 },
      { id: 51, title: 'Data Protection Best Practices', type: 'presentation', duration: 20, isCompleted: false, order: 2 },
      { id: 52, title: 'Data Subject Rights', type: 'reading', duration: 15, isCompleted: false, order: 3 },
      { id: 53, title: 'Privacy Impact Assessment', type: 'quiz', duration: 15, isCompleted: false, order: 4 },
      { id: 54, title: 'Incident Response Planning', type: 'assignment', duration: 18, isCompleted: false, order: 5 }
    ] },
    { id: 13, title: 'Ethical Business Practices', description: 'Maintain ethical standards.', duration: 4, modules: 6, image: 'ethics.jpg', status: 'Upcoming', completionRate: 0, targetAudience: 'Managers and executives', theme: 'Compliance', courseModules: [
      { id: 55, title: 'Business Ethics Foundations', type: 'video', duration: 30, isCompleted: false, order: 1 },
      { id: 56, title: 'Conflicts of Interest', type: 'presentation', duration: 20, isCompleted: false, order: 2 },
      { id: 57, title: 'Gifts and Gratuities Policy', type: 'reading', duration: 15, isCompleted: false, order: 3 },
      { id: 58, title: 'Whistleblowing Procedures', type: 'presentation', duration: 18, isCompleted: false, order: 4 },
      { id: 59, title: 'Case Study Analysis', type: 'quiz', duration: 12, isCompleted: false, order: 5 },
      { id: 60, title: 'Ethics Code Implementation', type: 'assignment', duration: 22, isCompleted: false, order: 6 }
    ] },
    { id: 14, title: 'Intellectual Property Rights', description: 'Protect company IP.', duration: 2.5, modules: 4, image: 'Intellectual-Property-Meaning.jpg', status: 'Active', completionRate: 63, targetAudience: 'Research and development', theme: 'Compliance', courseModules: [
      { id: 61, title: 'IP Rights Overview', type: 'video', duration: 20, isCompleted: true, order: 1 },
      { id: 62, title: 'Copyright and Trademark Basics', type: 'presentation', duration: 15, isCompleted: false, order: 2 },
      { id: 63, title: 'Trade Secret Protection', type: 'reading', duration: 12, isCompleted: false, order: 3 },
      { id: 64, title: 'IP Protection Strategies', type: 'quiz', duration: 10, isCompleted: false, order: 4 }
    ] },
    { id: 15, title: 'Regulatory Compliance Update', description: 'Latest industry regulations.', duration: 3, modules: 4, image: 'compliance.jpg', status: 'Active', completionRate: 41, targetAudience: 'Compliance officers', theme: 'Compliance', courseModules: [
      { id: 65, title: 'Current Regulatory Environment', type: 'video', duration: 25, isCompleted: false, order: 1 },
      { id: 66, title: 'Industry-Specific Regulations', type: 'presentation', duration: 18, isCompleted: false, order: 2 },
      { id: 67, title: 'Compliance Requirements Analysis', type: 'reading', duration: 15, isCompleted: false, order: 3 },
      { id: 68, title: 'Audit Preparation', type: 'quiz', duration: 12, isCompleted: false, order: 4 }
    ] },
    // Soft Skills
    { id: 16, title: 'Time Management', description: 'Effectively manage time and tasks.', duration: 1.5, modules: 3, image: 'time-management.jpeg', status: 'Active', completionRate: 89, targetAudience: 'All employees', theme: 'Soft Skills', courseModules: [
      { id: 69, title: 'Time Management Fundamentals', type: 'video', duration: 15, isCompleted: true, order: 1 },
      { id: 70, title: 'Prioritization Techniques', type: 'presentation', duration: 12, isCompleted: true, order: 2 },
      { id: 71, title: 'Time Management Assessment', type: 'quiz', duration: 8, isCompleted: true, order: 3 }
    ] },
    { id: 17, title: 'Emotional Intelligence', description: 'Develop emotional awareness.', duration: 4, modules: 5, image: 'ei.jpg', status: 'Active', completionRate: 76, targetAudience: 'All employees', theme: 'Soft Skills', courseModules: [
      { id: 72, title: 'EI Fundamentals', type: 'video', duration: 25, isCompleted: true, order: 1 },
      { id: 73, title: 'Self-Awareness Practice', type: 'presentation', duration: 20, isCompleted: true, order: 2 },
      { id: 74, title: 'Empathy Building', type: 'quiz', duration: 15, isCompleted: false, order: 3 },
      { id: 75, title: 'Social Skills Development', type: 'reading', duration: 18, isCompleted: false, order: 4 },
      { id: 76, title: 'EI in Practice', type: 'assignment', duration: 22, isCompleted: false, order: 5 }
    ] },
    { id: 18, title: 'Critical Thinking', description: 'Develop analytical and problem-solving skills.', duration: 2.5, modules: 4, image: 'criticalthinking.jpg', status: 'Upcoming', completionRate: 0, targetAudience: 'All employees', theme: 'Soft Skills', courseModules: [
      { id: 77, title: 'Introduction to Critical Thinking', type: 'video', duration: 20, isCompleted: false, order: 1 },
      { id: 78, title: 'Logical Reasoning and Fallacies', type: 'presentation', duration: 18, isCompleted: false, order: 2 },
      { id: 79, title: 'Problem Analysis Techniques', type: 'quiz', duration: 12, isCompleted: false, order: 3 },
      { id: 80, title: 'Decision Making Exercise', type: 'assignment', duration: 15, isCompleted: false, order: 4 }
    ] },
    { id: 19, title: 'Creativity and Innovation', description: 'Foster creative thinking.', duration: 3, modules: 4, image: 'final_left_side_right_side_brain_visual.jpg', status: 'Active', completionRate: 52, targetAudience: 'All employees', theme: 'Soft Skills', courseModules: [
      { id: 80, title: 'Creative Thinking Methods', type: 'video', duration: 22, isCompleted: true, order: 1 },
      { id: 81, title: 'Innovation Process Introduction', type: 'presentation', duration: 18, isCompleted: false, order: 2 },
      { id: 82, title: 'Brainstorming Techniques', type: 'quiz', duration: 12, isCompleted: false, order: 3 },
      { id: 83, title: 'Creativity Exercise', type: 'assignment', duration: 20, isCompleted: false, order: 4 }
    ] },
    { id: 20, title: 'Networking Skills', description: 'Build professional networks.', duration: 2.5, modules: 4, image: 'networking.jpg', status: 'Active', completionRate: 58, targetAudience: 'Mid-level and above', theme: 'Soft Skills', courseModules: [
      { id: 84, title: 'Professional Networking Benefits', type: 'video', duration: 20, isCompleted: false, order: 1 },
      { id: 85, title: 'Building Connections Strategies', type: 'presentation', duration: 15, isCompleted: false, order: 2 },
      { id: 86, title: 'Effective Elevator Pitch', type: 'quiz', duration: 10, isCompleted: false, order: 3 },
      { id: 87, title: 'Online Networking Tools', type: 'reading', duration: 12, isCompleted: false, order: 4 }
    ] },
    // Technical
    { id: 21, title: 'Cybersecurity Basics', description: 'Protect against cyber threats.', duration: 3, modules: 5, image: 'cyber.jpg', status: 'Active', completionRate: 81, targetAudience: 'All employees', theme: 'Technical', courseModules: [
      { id: 88, title: 'Cyber Threats Overview', type: 'video', duration: 22, isCompleted: true, order: 1 },
      { id: 89, title: 'Password Security Best Practices', type: 'presentation', duration: 15, isCompleted: true, order: 2 },
      { id: 90, title: 'Phishing Awareness', type: 'quiz', duration: 12, isCompleted: true, order: 3 },
      { id: 91, title: 'Data Protection Principles', type: 'reading', duration: 18, isCompleted: false, order: 4 },
      { id: 92, title: 'Security Incident Reporting', type: 'presentation', duration: 16, isCompleted: false, order: 5 }
    ] },
    { id: 22, title: 'Advanced Excel for Analysts', description: 'Master advanced Excel features.', duration: 5, modules: 8, image: 'excel.png', status: 'Active', completionRate: 49, targetAudience: 'Analysts and data roles', theme: 'Technical', courseModules: [
      { id: 93, title: 'Advanced Formulas', type: 'video', duration: 35, isCompleted: true, order: 1 },
      { id: 94, title: 'PivotTables and Data Analysis', type: 'presentation', duration: 28, isCompleted: false, order: 2 },
      { id: 95, title: 'Data Visualization with Charts', type: 'video', duration: 30, isCompleted: false, order: 3 },
      { id: 96, title: 'Conditional Formatting', type: 'quiz', duration: 15, isCompleted: false, order: 4 },
      { id: 97, title: 'Macros and Automation', type: 'presentation', duration: 40, isCompleted: false, order: 5 },
      { id: 98, title: 'Error Handling in Excel', type: 'reading', duration: 20, isCompleted: false, order: 6 },
      { id: 99, title: 'Data Import and Export', type: 'assignment', duration: 25, isCompleted: false, order: 7 },
      { id: 100, title: 'Advanced Excel Assessment', type: 'quiz', duration: 20, isCompleted: false, order: 8 }
    ] },
    { id: 23, title: 'Project Management Tools', description: 'Using PM software effectively.', duration: 4, modules: 6, image: 'project-management.jpg', status: 'Upcoming', completionRate: 0, targetAudience: 'Project managers', theme: 'Technical', courseModules: [
      { id: 101, title: 'PM Software Overview', type: 'video', duration: 25, isCompleted: false, order: 1 },
      { id: 102, title: 'Project Planning Basics', type: 'presentation', duration: 20, isCompleted: false, order: 2 },
      { id: 103, title: 'Task Management Features', type: 'reading', duration: 15, isCompleted: false, order: 3 },
      { id: 104, title: 'Collaboration Tools', type: 'video', duration: 18, isCompleted: false, order: 4 },
      { id: 105, title: 'Progress Tracking Methods', type: 'quiz', duration: 12, isCompleted: false, order: 5 },
      { id: 106, title: 'Reporting Dashboards', type: 'presentation', duration: 22, isCompleted: false, order: 6 }
    ] },
    { id: 24, title: 'Cloud Computing Fundamentals', description: 'Introduction to cloud technologies.', duration: 6, modules: 9, image: 'cloud.jpg', status: 'Active', completionRate: 35, targetAudience: 'IT and technical staff', theme: 'Technical', courseModules: [
      { id: 107, title: 'Cloud Computing Concepts', type: 'video', duration: 30, isCompleted: false, order: 1 },
      { id: 108, title: 'AWS vs Azure vs GCP Overview', type: 'presentation', duration: 25, isCompleted: false, order: 2 },
      { id: 109, title: 'Cloud Service Models (IaaS/PaaS/SaaS)', type: 'reading', duration: 20, isCompleted: false, order: 3 },
      { id: 110, title: 'Cloud Deployment Models', type: 'video', duration: 28, isCompleted: false, order: 4 },
      { id: 111, title: 'Cloud Security Fundamentals', type: 'presentation', duration: 32, isCompleted: false, order: 5 },
      { id: 112, title: 'Migration Strategies', type: 'quiz', duration: 18, isCompleted: false, order: 6 },
      { id: 113, title: 'Cost Optimization', type: 'reading', duration: 22, isCompleted: false, order: 7 },
      { id: 114, title: 'Compliance in Cloud', type: 'presentation', duration: 26, isCompleted: false, order: 8 },
      { id: 115, title: 'Cloud Computing Assessment', type: 'assignment', duration: 30, isCompleted: false, order: 9 }
    ] },
    { id: 25, title: 'Automation and Robotics', description: 'How AI and robotics impact work.', duration: 4.5, modules: 7, image: 'Automation-and-Robotics.jpeg', status: 'Active', completionRate: 23, targetAudience: 'Manufacturing and operations', theme: 'Technical', courseModules: [
      { id: 116, title: 'Automation Technology Overview', type: 'video', duration: 25, isCompleted: false, order: 1 },
      { id: 117, title: 'Robotics in Manufacturing', type: 'presentation', duration: 22, isCompleted: false, order: 2 },
      { id: 118, title: 'IML and Machine Learning Basics', type: 'reading', duration: 18, isCompleted: false, order: 3 },
      { id: 119, title: 'Process Automation', type: 'video', duration: 28, isCompleted: false, order: 4 },
      { id: 120, title: 'Safety in Automated Systems', type: 'quiz', duration: 15, isCompleted: false, order: 5 },
      { id: 121, title: 'Implementation Strategies', type: 'presentation', duration: 20, isCompleted: false, order: 6 },
      { id: 122, title: 'Future of Automation', type: 'reading', duration: 16, isCompleted: false, order: 7 }
    ] }
    // Semester review and planning session (removed from Technical)
  ]);

  private populatePathsWithCourses() {
    // This is a simplified example - in a real app, this would come from a backend
    const allCourses = this.getCourses();

    // For demo purposes, let's associate some courses with paths
    // In a real application, this mapping would come from the backend
    this.paths.update(paths => paths.map(path => {
      // If courses are already populated, don't overwrite them
      if (path.courses && path.courses.length > 0) {
        return path;
      }

      // Add some courses to each path based on theme or other criteria
      switch(path.id) {
        case 1: // Onboarding Path
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Safety' || c.theme === 'Compliance'
            ).slice(0, 3)
          };
        case 2: // Sales Training
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Soft Skills'
            ).slice(0, 2)
          };
        case 3: // Leadership Development
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Leadership'
            ).slice(0, 3)
          };
        case 4: // Technical Skills
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Technical'
            ).slice(0, 4)
          };
        case 5: // Compliance and Ethics
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Compliance'
            )
          };
        case 6: // Project Management
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Technical' || c.theme === 'Leadership'
            ).slice(0, 3)
          };
        case 7: // Customer Service Excellence
          return {
            ...path,
            courses: allCourses.filter(c =>
              c.theme === 'Soft Skills'
            ).slice(0, 2)
          };
        default:
          return {
            ...path,
            courses: allCourses.slice(0, 2) // Default to first 2 courses
          };
      }
    }));
  }

  getTrainings(): Training[] { return this.trainings(); }
  getPaths(): LearningPath[] { return this.paths(); }
  getCourses(): Course[] { return this.courses(); }
  getCoursesByTheme(theme: string): Course[] {
    return this.courses().filter(course => course.theme === theme);
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

    // Map departments to relevant themes
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
        course.theme.toLowerCase().includes(theme.toLowerCase()) ||
        theme.toLowerCase().includes(course.theme.toLowerCase())
      );

      if (themeCourses.length > 0) {
        const path: LearningPath = {
          id: 100 + index, // Unique ID for recommended paths
          title: `${theme} Development Path`,
          description: `Recommended learning path for ${department} professionals focusing on ${theme} skills`,
          estimatedHours: `${Math.round(themeCourses.slice(0, 3).reduce((sum, course) => sum + course.duration, 0))}h`,
          image: this.getPathImageForTheme(theme),
          courses: themeCourses.slice(0, 3), // Limit to 3 courses per path
          progress: Math.round(Math.random() * 100), // Mock progress
          status: this.getPathStatus(Math.random())
        };
        recommendedPaths.push(path);
      }
    });

    // If no theme-based paths were created, create a general one
    if (recommendedPaths.length === 0) {
      const generalPath: LearningPath = {
        id: 999,
        title: 'General Professional Development',
        description: 'General learning path for all professionals',
        estimatedHours: '10h',
        image: 'general-path.jpg',
        courses: allCourses.slice(0, 4),
        progress: Math.round(Math.random() * 100),
        status: this.getPathStatus(Math.random())
      };
      recommendedPaths.push(generalPath);
    }

    // Limit to 4 paths maximum
    return recommendedPaths.slice(0, 4);
  }

  /**
   * Get path status based on progress
   * @param progress - Progress value between 0 and 1
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

  // Métodos para Trainings
  addTraining(training: Training) {
    this.trainings.update(t => [...t, training]);
  }

  updateTraining(updated: Training) {
    this.trainings.update(t => t.map(tr => tr.id === updated.id ? updated : tr));
  }

  deleteTraining(id: number) {
    this.trainings.update(t => t.filter(tr => tr.id !== id));
    // Remove de paths se vinculado (noting that learning paths now use courses)
    // Keeping for legacy compatibility, but learning paths should use courses now
  }

  // Métodos para Learning Paths (novos!)
  addPath(path: LearningPath) {
    this.paths.update(p => [...p, path]);
  }

  updatePath(updated: LearningPath) {
    this.paths.update(p => p.map(pth => pth.id === updated.id ? updated : pth));
  }

  deletePath(id: number) {
    this.paths.update(p => p.filter(pth => pth.id !== id));
  }

  // Métodos para Courses
  addCourse(course: Course) {
    this.courses.update(c => [...c, course]);
  }

  updateCourse(updated: Course) {
    this.courses.update(c => c.map(course => course.id === updated.id ? updated : course));
  }

  deleteCourse(id: number) {
    this.courses.update(c => c.filter(course => course.id !== id));
  }
}
