/**
 * ============================================
 * DASHBOARD COMPONENT
 * ============================================
 * 
 * Main dashboard showing task statistics,
 * recent tasks, and quick actions.
 * 
 * FLOW:
 * 1. Component loads → fetches stats & tasks
 * 2. Displays visual charts for task completion
 * 3. Shows recent tasks with quick actions
 * 4. Dark/light mode support
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../core/services/tasks.service';
import { AuthService } from '../../core/services/auth.service';
import { ITask, TaskStatus, TaskPriority, Role } from '@libs/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Page Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {{ authService.getUserFullName() }}! Here's your task overview.
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <a routerLink="/tasks"
                 class="inline-flex items-center px-4 py-2 border border-transparent 
                        text-sm font-medium rounded-md shadow-sm text-white 
                        bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                        focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg class="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                New Task
              </a>
            </div>
          </div>
        </div>
      </div>

      <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Stats Grid -->
        <div *ngIf="!isLoading()" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Tasks -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Tasks
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ stats()?.total || 0 }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Completed Tasks -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Completed
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ stats()?.completed || 0 }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- In Progress -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      In Progress
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ stats()?.inProgress || 0 }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Overdue -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Overdue
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ stats()?.overdue || 0 }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Chart & Recent Tasks -->
        <div *ngIf="!isLoading()" class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Progress Chart -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Task Completion Progress
            </h3>
            
            <!-- Visual Progress Bar -->
            <div class="space-y-4">
              <!-- Completed -->
              <div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Completed</span>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ getPercentage('completed') }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div class="bg-green-500 h-3 rounded-full transition-all duration-500"
                       [style.width.%]="getPercentage('completed')"></div>
                </div>
              </div>

              <!-- In Progress -->
              <div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">In Progress</span>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ getPercentage('inProgress') }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div class="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                       [style.width.%]="getPercentage('inProgress')"></div>
                </div>
              </div>

              <!-- Todo -->
              <div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">To Do</span>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ getPercentage('todo') }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div class="bg-blue-500 h-3 rounded-full transition-all duration-500"
                       [style.width.%]="getPercentage('todo')"></div>
                </div>
              </div>
            </div>

            <!-- Pie Chart Visualization -->
            <div class="mt-6 flex justify-center">
              <svg viewBox="0 0 100 100" class="w-40 h-40">
                <!-- Background circle -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="20"/>
                
                <!-- Completed segment -->
                <circle cx="50" cy="50" r="40" fill="none" 
                        stroke="#22c55e" stroke-width="20"
                        [attr.stroke-dasharray]="getStrokeDasharray('completed')"
                        stroke-dashoffset="0"
                        transform="rotate(-90 50 50)"/>
                
                <!-- In Progress segment -->
                <circle cx="50" cy="50" r="40" fill="none" 
                        stroke="#eab308" stroke-width="20"
                        [attr.stroke-dasharray]="getStrokeDasharray('inProgress')"
                        [attr.stroke-dashoffset]="getStrokeOffset('inProgress')"
                        transform="rotate(-90 50 50)"/>
                
                <!-- Center text -->
                <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" 
                      class="text-xl font-bold fill-current text-gray-900 dark:text-white">
                  {{ getPercentage('completed') }}%
                </text>
              </svg>
            </div>
          </div>

          <!-- Recent Tasks -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Recent Tasks
              </h3>
              <a routerLink="/tasks" 
                 class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </a>
            </div>

            <div *ngIf="recentTasks().length === 0" 
                 class="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p>No tasks yet. Create your first task!</p>
            </div>

            <ul class="divide-y divide-gray-200 dark:divide-gray-700">
              <li *ngFor="let task of recentTasks()" 
                  class="py-3 flex items-center justify-between">
                <div class="flex items-center min-w-0">
                  <span [class]="getStatusDotClass(task.status)"
                        class="h-2.5 w-2.5 rounded-full mr-3 flex-shrink-0"></span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ task.title }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ task.category }} · {{ getPriorityLabel(task.priority) }}
                    </p>
                  </div>
                </div>
                <span [class]="getStatusBadgeClass(task.status)"
                      class="ml-2 px-2 py-1 text-xs font-medium rounded-full">
                  {{ getStatusLabel(task.status) }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Quick Actions -->
        <div *ngIf="!isLoading()" class="mt-8">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a routerLink="/tasks" [queryParams]="{status: 'TODO'}"
               class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md 
                      transition-shadow flex items-center space-x-3">
              <div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">View To Do</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ stats()?.todo || 0 }} tasks</p>
              </div>
            </a>

            <a routerLink="/tasks" [queryParams]="{priority: 'HIGH'}"
               class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md 
                      transition-shadow flex items-center space-x-3">
              <div class="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">High Priority</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Urgent tasks</p>
              </div>
            </a>

            <a *ngIf="authService.isAdminOrOwner()" routerLink="/audit"
               class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md 
                      transition-shadow flex items-center space-x-3">
              <div class="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Audit Log</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">View activity</p>
              </div>
            </a>

            <a routerLink="/profile"
               class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md 
                      transition-shadow flex items-center space-x-3">
              <div class="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Profile</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Settings</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  isLoading = signal(true);
  stats = signal<any>(null);
  recentTasks = signal<ITask[]>([]);

  constructor(
    private tasksService: TasksService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load stats
    this.tasksService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      },
      error: (err) => console.error('Failed to load stats', err)
    });

    // Load recent tasks
    this.tasksService.getTasks({ limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentTasks.set(response.data || []);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoading.set(false);
      }
    });
  }

  getPercentage(type: string): number {
    const s = this.stats();
    if (!s || !s.total) return 0;
    
    switch (type) {
      case 'completed': return Math.round((s.completed / s.total) * 100);
      case 'inProgress': return Math.round((s.inProgress / s.total) * 100);
      case 'todo': return Math.round((s.todo / s.total) * 100);
      default: return 0;
    }
  }

  getStrokeDasharray(type: string): string {
    const circumference = 2 * Math.PI * 40;
    const percentage = this.getPercentage(type);
    const value = (percentage / 100) * circumference;
    return `${value} ${circumference}`;
  }

  getStrokeOffset(type: string): string {
    const circumference = 2 * Math.PI * 40;
    const completedPercentage = this.getPercentage('completed');
    const offset = (completedPercentage / 100) * circumference;
    return `-${offset}`;
  }

  getStatusDotClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.DONE: return 'bg-green-500';
      case TaskStatus.IN_PROGRESS: return 'bg-yellow-500';
      case TaskStatus.TODO: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  }

  getStatusBadgeClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.DONE: 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case TaskStatus.IN_PROGRESS: 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case TaskStatus.TODO: 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.DONE: return 'Done';
      case TaskStatus.IN_PROGRESS: return 'In Progress';
      case TaskStatus.TODO: return 'To Do';
      default: return status;
    }
  }

  getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH: return '🔴 High';
      case TaskPriority.MEDIUM: return '🟡 Medium';
      case TaskPriority.LOW: return '🟢 Low';
      default: return priority;
    }
  }
}
