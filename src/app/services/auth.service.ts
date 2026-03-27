import { Injectable } from '@angular/core';
import { Observable, from, tap, map, catchError, throwError } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { SupabaseService } from './supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private supabaseService: SupabaseService) {}

  // 🔹 LOGIN – using Supabase authentication
  login(usuario: Pick<Usuario, 'nome' | 'senha'>): Observable<Usuario> {
    return from(
      this.supabaseService.supabase.auth.signInWithPassword({
        email: usuario.nome,
        password: usuario.senha
      })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }

        // Get user data from Supabase
        const user = response.data.user;
        const usuarioLogado: Usuario = {
          id: user.id,
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'User',
          senha: '',
          email: user.email || '',
          perfil: user.user_metadata?.perfil || 'user',
          department: user.user_metadata?.department
        };

        // Store in localStorage for session management
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
        localStorage.setItem('supabase_session', JSON.stringify(response.data.session));

        return usuarioLogado;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => ({ status: 401, message: 'Invalid credentials. Check username and password.' }));
      }),
      tap((response) => console.log("✅ Login successful!", response))
    );
  }

  // 🔹 REGISTER – creates user in Supabase
  register(userData: { nome: string, email: string, senha: string, department?: string }): Observable<Usuario> {
    return from(
      this.supabaseService.supabase.auth.signUp({
        email: userData.email,
        password: userData.senha,
        options: {
          data: {
            nome: userData.nome,
            perfil: 'user',
            department: userData.department
          }
        }
      })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw response.error;
        }

        const user = response.data.user;
        const usuarioLogado: Usuario = {
          id: user.id,
          nome: user.user_metadata?.nome || userData.nome,
          senha: '',
          email: user.email || userData.email,
          perfil: user.user_metadata?.perfil || 'user',
          department: user.user_metadata?.department || userData.department
        };

        // Store in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
        if (response.data.session) {
          localStorage.setItem('supabase_session', JSON.stringify(response.data.session));
        }

        return usuarioLogado;
      }),
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => ({ status: 409, message: 'User already exists or registration failed.' }));
      }),
      tap((response) => console.log("✅ Registration and automatic login completed!", response))
    );
  }

  // 🔹 Check if user is logged in
  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // 🔹 Return logged in user data
  getCurrentUser(): Usuario | null {
    const userData = localStorage.getItem('usuario');
    return userData ? JSON.parse(userData) : null;
  }

  // 🔹 Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.perfil === 'admin' : false;
  }

  // 🔹 Logout
  logout(): Observable<void> {
    return from(
      this.supabaseService.supabase.auth.signOut()
    ).pipe(
      map(() => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('usuario');
        localStorage.removeItem('supabase_session');
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        // Even if Supabase logout fails, clear local storage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('usuario');
        localStorage.removeItem('supabase_session');
        return throwError(() => error);
      })
    );
  }

  // 🔹 Get current Supabase session
  getCurrentSession() {
    const sessionData = localStorage.getItem('supabase_session');
    return sessionData ? JSON.parse(sessionData) : null;
  }
}
