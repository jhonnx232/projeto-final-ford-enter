import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  currentUser: any = null;
  isAdmin = false;
  isSidebarOpen = false;
  isMobile = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get current user data
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();

    // Check if mobile on init
    this.checkIsMobile();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails, navigate to login
        this.router.navigate(['/login']);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIsMobile();
    // Close sidebar when resizing to desktop
    if (!this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  checkIsMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Close sidebar when clicking outside on mobile
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.mobile-menu-toggle');

    if (this.isMobile && this.isSidebarOpen) {
      // Check if click is outside sidebar and toggle button
      if (sidebar && !sidebar.contains(event.target as Node) &&
          toggleButton && !toggleButton.contains(event.target as Node)) {
        this.isSidebarOpen = false;
      }

      // If toggle button is not available, just check sidebar
      if (!toggleButton && sidebar && !sidebar.contains(event.target as Node)) {
        this.isSidebarOpen = false;
      }
    }
  }
}
