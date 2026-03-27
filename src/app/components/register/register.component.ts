import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  showPrivacyModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      department: [''],
      acceptedTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    }
    return null;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach(c => c.markAsTouched());
      if (!this.registerForm.get('acceptedTerms')?.value) {
        this.errorMessage = 'You must accept the privacy policy (LGPD) before creating an account.';
      }
      return;
    }

    this.isSubmitting = true;
    const { name, email, password, department } = this.registerForm.value;

    this.authService.register({ nome: name, email, senha: password, department }).subscribe({
      next: (user) => {
        this.successMessage = `Welcome, ${user.nome}! Registration successful.`;
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          // Navigate to user home page
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = err.status === 409
          ? 'Email or username already exists.'
          : 'Registration failed. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  openPrivacyPolicy(event: Event) {
    event.preventDefault();
    this.showPrivacyModal = true;
    document.body.classList.add('no-scroll'); // ✅ prevents double scroll
  }

  closePrivacyPolicy() {
    this.showPrivacyModal = false;
    document.body.classList.remove('no-scroll');
  }

  @HostListener('document:keydown.escape')
  onEscKey() {
    if (this.showPrivacyModal) this.closePrivacyPolicy();
  }

  // Method to navigate back to login page
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
