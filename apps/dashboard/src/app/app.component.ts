/**
 * ============================================
 * APP COMPONENT (ROOT)
 * ============================================
 * 
 * The root component of the Angular application.
 * Contains the main layout with:
 * - Navigation bar
 * - Router outlet for child components
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: \`
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Navigation -->
      <nav *ngIf="authService.isAuthenticated()" 
           class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <!-- Logo & Main Nav -->
            <div class="flex">
              <!-- Logo -->
              <div class="flex-shrink-0 flex items-center">
                <span class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  📋 TaskManager
                </span>
              </div>
              
              <!-- Desktop Nav -->
              <div class="hidden sm:ml-8 sm:flex sm:space-x-4">
                <a routerLink="/dashboard" 
                   routerLinkActive="bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                   class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Dashboard
                </a>
                <a routerLink="/tasks" 
                   routerLinkActive="bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                   class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Tasks
                </a>
                <a *ngIf="authService.isAdminOrOwner()"
                   routerLink="/audit" 
                   routerLinkActive="bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                   class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Audit Log
                </a>
              </div>
            </div>

            <!-- Right side: User menu -->
            <div class="flex items-center space-x-4">
              <!-- Dark mode toggle -->
              <button (click)="toggleDarkMode()" 
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 
                             hover:bg-gray-100 dark:hover:bg-gray-700">
                <span *ngIf="!isDarkMode">🌙</span>
                <span *ngIf="isDarkMode">☀️</span>
              </button>

              <!-- User info -->
              <div class="flex items-center">
                <span class="text-sm text-gray-700 dark:text-gray-300 mr-2">
                  {{ authService.getCurrentUser()?.email }}
                </span>
                <span class="px-2 py-1 text-xs rounded-full"
                      [ngClass]="{
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': authService.getCurrentUser()?.role === 'owner',
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': authService.getCurrentUser()?.role === 'admin',
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': authService.getCurrentUser()?.role === 'viewer'
                      }">
                  {{ authService.getCurrentUser()?.role | uppercase }}
                </span>
              </div>

              <!-- Logout button -->
              <button (click)="logout()" 
                      class="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 
                             hover:bg-indigo-700 rounded-md transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer *ngIf="authService.isAuthenticated()" 
              class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Task Management System v1.0.0 | Built with NestJS + Angular
        </div>
      </footer>
    </div>
  \`,
  styles: [\`
    :host {
      display: block;
    }
  \`]
})
export class AppComponent {
  isDarkMode = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Check for saved dark mode preference
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyDarkMode();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyDarkMode();
  }

  private applyDarkMode(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
