import { Component, OnInit, signal, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../models/usuario.model';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  usuario = {
    nome: '',
    senha: ''
  };

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  showPassword = false; // Add password visibility toggle

  // Signal to control registration modal display
  showRegisterModal = signal(false);

  // Inject auth and routes to use the methods
  constructor(
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    // If already logged in, redirect to home
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    // Add listener for iframe messages
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  ngOnDestroy() {
    // Remove listener when component is destroyed
    window.removeEventListener('message', this.handleMessage.bind(this));
  }

  // Handler for iframe messages
  handleMessage(event: MessageEvent) {
    if (event.data && event.data.type === 'REGISTER_SUCCESS') {
      this.onRegisterSuccess();
    }
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login(){
    if (!this.usuario.nome || !this.usuario.senha) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.login(this.usuario).subscribe({
      next:(response)=> {
        console.log("Login successful!", response);
        this.isLoading = false;
        this.successMessage = 'Login successful!';

        // Navigate immediately after successful login
        setTimeout(() => {
          this.router.navigate(["/home"]);
        }, 1500);
      },
      error:(err)=>{
        console.log("Error logging in", err);
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid credentials. Check username and password.';
        } else {
          this.errorMessage = 'Error connecting to server. Please try again.';
        }
      }
    })
  }

  // Method to navigate to registration page (instead of opening modal)
  openRegisterModal() {
    // Navigate to registration page instead of opening modal
    this.router.navigate(['/register']);
  }

  // Method to close registration modal
  closeRegisterModal() {
    this.showRegisterModal.set(false);
  }

  // Method to close modal when clicking outside
  onModalClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeRegisterModal();
    }
  }

  // Method called when registration is successful in iframe
  onRegisterSuccess() {
    this.closeRegisterModal();
    // Update success message in login
    this.successMessage = 'Registration successful! You can now log in with your new account.';
  }
}
