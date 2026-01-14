/**
 * ============================================
 * LOGIN COMPONENT
 * ============================================
 * 
 * User authentication interface.
 * 
 * FEATURES:
 * ---------
 * • Email/password form
 * • Form validation
 * • Error handling
 * • Remember me (optional)
 * • Link to registration
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: \`
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white">📋</h1>
          <h2 class="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your Task Manager account
          </p>
        </div>

        <!-- Error Alert -->
        <div *ngIf="error()" 
             class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
                    text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          <div class="flex items-center">
            <span class="mr-2">⚠️</span>
            <span>{{ error() }}</span>
          </div>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [class.border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg shadow-sm placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
            <p *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
               class="mt-1 text-sm text-red-500">
              Please enter a valid email address
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg shadow-sm placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
            <p *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
               class="mt-1 text-sm text-red-500">
              Password is required
            </p>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="isLoading() || loginForm.invalid"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                     shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span *ngIf="isLoading()" class="mr-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </span>
              {{ isLoading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>

        <!-- Demo Credentials -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔐 Demo Credentials:
          </h3>
          <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div class="flex justify-between">
              <span>Owner:</span>
              <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">owner&#64;techcorp.com / Owner123!</code>
            </div>
            <div class="flex justify-between">
              <span>Admin:</span>
              <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">admin&#64;engineering.com / Admin123!</code>
            </div>
            <div class="flex justify-between">
              <span>Viewer:</span>
              <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">viewer&#64;engineering.com / Viewer123!</code>
            </div>
          </div>
        </div>

        <!-- Register Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <a routerLink="/register" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  \`
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);

  private returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
      },
    });
  }
}
