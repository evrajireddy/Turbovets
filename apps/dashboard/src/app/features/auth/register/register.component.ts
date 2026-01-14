/**
 * ============================================
 * REGISTER COMPONENT
 * ============================================
 * 
 * New user registration interface.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: \`
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white">📋</h1>
          <h2 class="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join Task Manager and boost your productivity
          </p>
        </div>

        <!-- Error/Success Alert -->
        <div *ngIf="error()" 
             class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
                    text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {{ error() }}
        </div>

        <div *ngIf="success()" 
             class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 
                    text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {{ success() }}
        </div>

        <!-- Register Form -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-5">
          <!-- First Name -->
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              formControlName="firstName"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     dark:bg-gray-700 dark:text-white"
              placeholder="John"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              formControlName="lastName"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     dark:bg-gray-700 dark:text-white"
              placeholder="Doe"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
                     rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              At least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="isLoading() || registerForm.invalid"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                     shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading() ? 'Creating account...' : 'Create Account' }}
            </button>
          </div>
        </form>

        <!-- Login Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  \`
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.success.set('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }
}
