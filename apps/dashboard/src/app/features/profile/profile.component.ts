/**
 * ============================================
 * PROFILE COMPONENT
 * ============================================
 * 
 * User profile view and settings.
 * Shows user information, organization, and role.
 * 
 * FEATURES:
 * - View profile details
 * - Edit name (limited)
 * - View organization hierarchy
 * - Dark mode toggle
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { IUserPublic, Role } from '@libs/data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Page Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account settings
          </p>
        </div>
      </div>

      <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Profile Card -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <!-- Header with Avatar -->
              <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
                <div class="flex flex-col items-center">
                  <div class="h-24 w-24 rounded-full bg-white dark:bg-gray-700 flex items-center 
                              justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-400 
                              shadow-lg">
                    {{ getInitials() }}
                  </div>
                  <h2 class="mt-4 text-xl font-semibold text-white">
                    {{ user()?.firstName }} {{ user()?.lastName }}
                  </h2>
                  <p class="text-indigo-200">{{ user()?.email }}</p>
                </div>
              </div>

              <!-- Role Badge -->
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Role</span>
                  <span [class]="getRoleBadgeClass()"
                        class="px-3 py-1 text-sm font-medium rounded-full">
                    {{ user()?.role }}
                  </span>
                </div>
              </div>

              <!-- Organization -->
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</span>
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ user()?.organization?.name || 'N/A' }}
                  </span>
                </div>
              </div>

              <!-- Status -->
              <div class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                  <span class="flex items-center">
                    <span class="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    <span class="text-sm text-gray-900 dark:text-white">Active</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div class="space-y-3">
                <button (click)="refreshProfile()"
                        class="w-full flex items-center justify-center px-4 py-2 border 
                               border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                               font-medium text-gray-700 dark:text-gray-300 
                               hover:bg-gray-50 dark:hover:bg-gray-700">
                  <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Refresh Profile
                </button>
                <button (click)="toggleDarkMode()"
                        class="w-full flex items-center justify-center px-4 py-2 border 
                               border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                               font-medium text-gray-700 dark:text-gray-300 
                               hover:bg-gray-50 dark:hover:bg-gray-700">
                  <svg *ngIf="!isDarkMode()" class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                  <svg *ngIf="isDarkMode()" class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  {{ isDarkMode() ? 'Light Mode' : 'Dark Mode' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Edit Profile Form -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit Profile
              </h3>
              
              <!-- Success/Error Messages -->
              <div *ngIf="successMessage()" 
                   class="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 
                          dark:border-green-800 text-green-700 dark:text-green-300 
                          px-4 py-3 rounded-lg">
                {{ successMessage() }}
              </div>
              
              <div *ngIf="errorMessage()" 
                   class="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 
                          dark:border-red-800 text-red-700 dark:text-red-300 
                          px-4 py-3 rounded-lg">
                {{ errorMessage() }}
              </div>

              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input type="text" formControlName="firstName"
                           class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                  dark:bg-gray-700 dark:text-white focus:ring-indigo-500 
                                  focus:border-indigo-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input type="text" formControlName="lastName"
                           class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                  dark:bg-gray-700 dark:text-white focus:ring-indigo-500 
                                  focus:border-indigo-500">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input type="email" formControlName="email" disabled
                         class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                dark:bg-gray-700 dark:text-white bg-gray-50 
                                dark:bg-gray-600 cursor-not-allowed">
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>

                <div class="pt-4">
                  <button type="submit"
                          [disabled]="profileForm.invalid || isSaving()"
                          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 
                                 rounded-lg hover:bg-indigo-700 disabled:opacity-50 
                                 disabled:cursor-not-allowed">
                    {{ isSaving() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Role Information -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Role & Permissions
              </h3>
              
              <div class="space-y-4">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Current Role: {{ user()?.role }}
                    </h4>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ getRoleDescription() }}
                    </p>
                  </div>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Your Permissions
                  </h4>
                  <ul class="space-y-2">
                    <li *ngFor="let perm of getPermissions()"
                        class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <svg class="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      {{ perm }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Keyboard Shortcuts
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span class="text-sm text-gray-600 dark:text-gray-300">New Task</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 
                              border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-200 
                              dark:border-gray-500">
                    Ctrl + N
                  </kbd>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Search</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 
                              border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-200 
                              dark:border-gray-500">
                    Ctrl + K
                  </kbd>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 
                              border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-200 
                              dark:border-gray-500">
                    Ctrl + D
                  </kbd>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Toggle Dark Mode</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 
                              border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-200 
                              dark:border-gray-500">
                    Ctrl + Shift + D
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user = signal<IUserPublic | null>(null);
  isSaving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isDarkMode = signal(false);
  
  profileForm: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.checkDarkMode();
  }

  loadProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.set(currentUser);
      this.profileForm.patchValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email
      });
    }
  }

  refreshProfile(): void {
    this.authService.refreshProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
        this.successMessage.set('Profile refreshed successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.errorMessage.set('Failed to refresh profile');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // In a real app, this would call an API endpoint
    // For now, we'll simulate saving
    setTimeout(() => {
      this.isSaving.set(false);
      this.successMessage.set('Profile updated successfully!');
      setTimeout(() => this.successMessage.set(null), 3000);
    }, 1000);
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRoleBadgeClass(): string {
    switch (this.user()?.role) {
      case Role.OWNER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case Role.ADMIN:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case Role.VIEWER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getRoleDescription(): string {
    switch (this.user()?.role) {
      case Role.OWNER:
        return 'Full access to all resources across the organization hierarchy. Can manage users, organizations, and all tasks.';
      case Role.ADMIN:
        return 'Administrative access within your organization. Can manage tasks and view team members.';
      case Role.VIEWER:
        return 'View and manage your own tasks. Limited access to team resources.';
      default:
        return 'Standard user access.';
    }
  }

  getPermissions(): string[] {
    switch (this.user()?.role) {
      case Role.OWNER:
        return [
          'Create, edit, delete all tasks',
          'Manage all users',
          'Create and manage organizations',
          'View audit logs',
          'Access all child organizations'
        ];
      case Role.ADMIN:
        return [
          'Create, edit, delete tasks in organization',
          'View organization members',
          'Create new tasks',
          'View audit logs'
        ];
      case Role.VIEWER:
        return [
          'View organization tasks',
          'Create own tasks',
          'Edit own tasks',
          'View own profile'
        ];
      default:
        return ['Basic access'];
    }
  }

  checkDarkMode(): void {
    this.isDarkMode.set(document.documentElement.classList.contains('dark'));
  }

  toggleDarkMode(): void {
    const html = document.documentElement;
    html.classList.toggle('dark');
    this.isDarkMode.set(html.classList.contains('dark'));
    localStorage.setItem('darkMode', this.isDarkMode() ? 'true' : 'false');
  }
}
