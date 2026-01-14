/**
 * ============================================
 * TASKS COMPONENT
 * ============================================
 * 
 * Main task management interface with:
 * - Kanban board view (drag-and-drop)
 * - List view with sorting/filtering
 * - Create/Edit/Delete tasks
 * - Category filters
 * 
 * FLOW:
 * 1. Load tasks on init
 * 2. Display in chosen view (Kanban/List)
 * 3. Drag-drop to change status
 * 4. Modal for create/edit
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TasksService } from '../../core/services/tasks.service';
import { AuthService } from '../../core/services/auth.service';
import { ITask, TaskStatus, TaskPriority, TaskCategory, CreateTaskDto, UpdateTaskDto } from '@libs/data';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Page Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage and organize your tasks
              </p>
            </div>
            
            <!-- Controls -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- View Toggle -->
              <div class="flex rounded-lg shadow-sm">
                <button (click)="viewMode.set('kanban')"
                        [class.bg-indigo-600]="viewMode() === 'kanban'"
                        [class.text-white]="viewMode() === 'kanban'"
                        [class.bg-white]="viewMode() !== 'kanban'"
                        [class.dark:bg-gray-700]="viewMode() !== 'kanban'"
                        class="px-4 py-2 text-sm font-medium rounded-l-lg border 
                               border-gray-300 dark:border-gray-600">
                  Kanban
                </button>
                <button (click)="viewMode.set('list')"
                        [class.bg-indigo-600]="viewMode() === 'list'"
                        [class.text-white]="viewMode() === 'list'"
                        [class.bg-white]="viewMode() !== 'list'"
                        [class.dark:bg-gray-700]="viewMode() !== 'list'"
                        class="px-4 py-2 text-sm font-medium rounded-r-lg border 
                               border-gray-300 dark:border-gray-600 -ml-px">
                  List
                </button>
              </div>

              <!-- Category Filter -->
              <select [(ngModel)]="selectedCategory"
                      (ngModelChange)="filterTasks()"
                      class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 
                             dark:text-white text-sm">
                <option value="">All Categories</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>

              <!-- Priority Filter -->
              <select [(ngModel)]="selectedPriority"
                      (ngModelChange)="filterTasks()"
                      class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 
                             dark:text-white text-sm">
                <option value="">All Priorities</option>
                <option value="HIGH">🔴 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>

              <!-- Create Button -->
              <button (click)="openCreateModal()"
                      class="inline-flex items-center px-4 py-2 border border-transparent 
                             text-sm font-medium rounded-lg shadow-sm text-white 
                             bg-indigo-600 hover:bg-indigo-700">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Kanban View -->
        <div *ngIf="!isLoading() && viewMode() === 'kanban'" 
             class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- TODO Column -->
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                To Do
                <span class="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                             text-xs px-2 py-0.5 rounded-full">
                  {{ todoTasks().length }}
                </span>
              </h3>
            </div>
            
            <div class="space-y-3 min-h-[200px]"
                 (dragover)="onDragOver($event)"
                 (drop)="onDrop($event, 'TODO')">
              <div *ngFor="let task of todoTasks(); let i = index"
                   [draggable]="true"
                   (dragstart)="onDragStart($event, task)"
                   (dragend)="onDragEnd($event)"
                   class="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm cursor-move
                          hover:shadow-md transition-shadow border-l-4"
                   [class.border-red-500]="task.priority === 'HIGH'"
                   [class.border-yellow-500]="task.priority === 'MEDIUM'"
                   [class.border-green-500]="task.priority === 'LOW'">
                <div class="flex items-start justify-between">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ task.title }}
                  </h4>
                  <div class="flex space-x-1">
                    <button (click)="openEditModal(task)"
                            class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="deleteTask(task)"
                            class="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p *ngIf="task.description" 
                   class="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {{ task.description }}
                </p>
                <div class="mt-3 flex items-center justify-between text-xs">
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 
                               text-gray-600 dark:text-gray-300">
                    {{ task.category }}
                  </span>
                  <span *ngIf="task.dueDate" 
                        [class.text-red-500]="isOverdue(task.dueDate)"
                        class="text-gray-500 dark:text-gray-400">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
              </div>
              
              <div *ngIf="todoTasks().length === 0" 
                   class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-sm">No tasks</p>
              </div>
            </div>
          </div>

          <!-- IN PROGRESS Column -->
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <span class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                In Progress
                <span class="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                             text-xs px-2 py-0.5 rounded-full">
                  {{ inProgressTasks().length }}
                </span>
              </h3>
            </div>
            
            <div class="space-y-3 min-h-[200px]"
                 (dragover)="onDragOver($event)"
                 (drop)="onDrop($event, 'IN_PROGRESS')">
              <div *ngFor="let task of inProgressTasks()"
                   [draggable]="true"
                   (dragstart)="onDragStart($event, task)"
                   (dragend)="onDragEnd($event)"
                   class="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm cursor-move
                          hover:shadow-md transition-shadow border-l-4"
                   [class.border-red-500]="task.priority === 'HIGH'"
                   [class.border-yellow-500]="task.priority === 'MEDIUM'"
                   [class.border-green-500]="task.priority === 'LOW'">
                <div class="flex items-start justify-between">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ task.title }}
                  </h4>
                  <div class="flex space-x-1">
                    <button (click)="openEditModal(task)"
                            class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="deleteTask(task)"
                            class="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p *ngIf="task.description" 
                   class="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {{ task.description }}
                </p>
                <div class="mt-3 flex items-center justify-between text-xs">
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 
                               text-gray-600 dark:text-gray-300">
                    {{ task.category }}
                  </span>
                  <span *ngIf="task.dueDate" 
                        [class.text-red-500]="isOverdue(task.dueDate)"
                        class="text-gray-500 dark:text-gray-400">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
              </div>
              
              <div *ngIf="inProgressTasks().length === 0" 
                   class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-sm">No tasks</p>
              </div>
            </div>
          </div>

          <!-- DONE Column -->
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Done
                <span class="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                             text-xs px-2 py-0.5 rounded-full">
                  {{ doneTasks().length }}
                </span>
              </h3>
            </div>
            
            <div class="space-y-3 min-h-[200px]"
                 (dragover)="onDragOver($event)"
                 (drop)="onDrop($event, 'DONE')">
              <div *ngFor="let task of doneTasks()"
                   [draggable]="true"
                   (dragstart)="onDragStart($event, task)"
                   (dragend)="onDragEnd($event)"
                   class="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm cursor-move
                          hover:shadow-md transition-shadow border-l-4 border-green-500 opacity-75">
                <div class="flex items-start justify-between">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white line-through">
                    {{ task.title }}
                  </h4>
                  <div class="flex space-x-1">
                    <button (click)="openEditModal(task)"
                            class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="deleteTask(task)"
                            class="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p *ngIf="task.description" 
                   class="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {{ task.description }}
                </p>
                <div class="mt-3 flex items-center justify-between text-xs">
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 
                               text-gray-600 dark:text-gray-300">
                    {{ task.category }}
                  </span>
                </div>
              </div>
              
              <div *ngIf="doneTasks().length === 0" 
                   class="text-center py-8 text-gray-400 dark:text-gray-500">
                <p class="text-sm">No tasks</p>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div *ngIf="!isLoading() && viewMode() === 'list'" 
             class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                           uppercase tracking-wider cursor-pointer"
                    (click)="sortBy('title')">
                  Title
                  <span *ngIf="sortField === 'title'">{{ sortOrder === 'ASC' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                           uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                           uppercase tracking-wider cursor-pointer"
                    (click)="sortBy('priority')">
                  Priority
                  <span *ngIf="sortField === 'priority'">{{ sortOrder === 'ASC' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                           uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                           uppercase tracking-wider cursor-pointer"
                    (click)="sortBy('dueDate')">
                  Due Date
                  <span *ngIf="sortField === 'dueDate'">{{ sortOrder === 'ASC' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 
                           uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let task of filteredTasks()"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white"
                       [class.line-through]="task.status === 'DONE'">
                    {{ task.title }}
                  </div>
                  <div *ngIf="task.description" 
                       class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {{ task.description }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select [ngModel]="task.status"
                          (ngModelChange)="updateTaskStatus(task, $event)"
                          class="text-sm rounded-full px-3 py-1 border-0"
                          [class.bg-blue-100]="task.status === 'TODO'"
                          [class.text-blue-800]="task.status === 'TODO'"
                          [class.bg-yellow-100]="task.status === 'IN_PROGRESS'"
                          [class.text-yellow-800]="task.status === 'IN_PROGRESS'"
                          [class.bg-green-100]="task.status === 'DONE'"
                          [class.text-green-800]="task.status === 'DONE'">
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                        [class.bg-red-100]="task.priority === 'HIGH'"
                        [class.text-red-800]="task.priority === 'HIGH'"
                        [class.bg-yellow-100]="task.priority === 'MEDIUM'"
                        [class.text-yellow-800]="task.priority === 'MEDIUM'"
                        [class.bg-green-100]="task.priority === 'LOW'"
                        [class.text-green-800]="task.priority === 'LOW'">
                    {{ task.priority }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ task.category }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm"
                    [class.text-red-500]="task.dueDate && isOverdue(task.dueDate)"
                    [class.text-gray-500]="!task.dueDate || !isOverdue(task.dueDate)"
                    [class.dark:text-gray-400]="!task.dueDate || !isOverdue(task.dueDate)">
                  {{ task.dueDate ? formatDate(task.dueDate) : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="openEditModal(task)"
                          class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 
                                 dark:hover:text-indigo-300 mr-3">
                    Edit
                  </button>
                  <button (click)="deleteTask(task)"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 
                                 dark:hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
              
              <tr *ngIf="filteredTasks().length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p>No tasks found. Create your first task!</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <!-- Task Modal -->
      <div *ngIf="showModal()" 
           class="fixed inset-0 z-50 overflow-y-auto"
           (click)="closeModal()">
        <div class="flex items-center justify-center min-h-screen px-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
          
          <!-- Modal Content -->
          <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6"
               (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ editingTask() ? 'Edit Task' : 'Create Task' }}
              </h3>
              <button (click)="closeModal()"
                      class="text-gray-400 hover:text-gray-500">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form [formGroup]="taskForm" (ngSubmit)="saveTask()" class="space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input type="text" formControlName="title"
                       class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                              dark:bg-gray-700 dark:text-white focus:ring-indigo-500 
                              focus:border-indigo-500"
                       placeholder="Enter task title">
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea formControlName="description" rows="3"
                          class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 
                                 focus:border-indigo-500"
                          placeholder="Enter task description"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select formControlName="status"
                          class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                 dark:bg-gray-700 dark:text-white">
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <!-- Priority -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select formControlName="priority"
                          class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                 dark:bg-gray-700 dark:text-white">
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🔴 High</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select formControlName="category"
                          class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                 dark:bg-gray-700 dark:text-white">
                    <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                  </select>
                </div>

                <!-- Due Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input type="date" formControlName="dueDate"
                         class="w-full rounded-lg border-gray-300 dark:border-gray-600 
                                dark:bg-gray-700 dark:text-white">
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" (click)="closeModal()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                               bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                               rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit"
                        [disabled]="taskForm.invalid || isSaving()"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 
                               rounded-lg hover:bg-indigo-700 disabled:opacity-50 
                               disabled:cursor-not-allowed">
                  {{ isSaving() ? 'Saving...' : (editingTask() ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TasksComponent implements OnInit {
  // State signals
  isLoading = signal(true);
  isSaving = signal(false);
  showModal = signal(false);
  editingTask = signal<ITask | null>(null);
  viewMode = signal<'kanban' | 'list'>('kanban');
  allTasks = signal<ITask[]>([]);
  
  // Filters
  selectedCategory = '';
  selectedPriority = '';
  sortField = 'createdAt';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  
  // Categories
  categories = Object.values(TaskCategory);
  
  // Form
  taskForm: FormGroup;
  
  // Drag state
  draggedTask: ITask | null = null;

  // Computed signals for filtered tasks by status
  filteredTasks = computed(() => {
    let tasks = this.allTasks();
    
    if (this.selectedCategory) {
      tasks = tasks.filter(t => t.category === this.selectedCategory);
    }
    if (this.selectedPriority) {
      tasks = tasks.filter(t => t.priority === this.selectedPriority);
    }
    
    return tasks;
  });

  todoTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === TaskStatus.TODO)
  );

  inProgressTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === TaskStatus.IN_PROGRESS)
  );

  doneTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === TaskStatus.DONE)
  );

  constructor(
    private tasksService: TasksService,
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      status: [TaskStatus.TODO],
      priority: [TaskPriority.MEDIUM],
      category: [TaskCategory.WORK],
      dueDate: [null]
    });
  }

  ngOnInit(): void {
    // Check for query params (from dashboard quick actions)
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        // Could filter by status if needed
      }
      if (params['priority']) {
        this.selectedPriority = params['priority'];
      }
    });
    
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    
    const params: any = {
      sortBy: this.sortField,
      sortOrder: this.sortOrder
    };
    
    this.tasksService.getTasks(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.allTasks.set(response.data || []);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoading.set(false);
      }
    });
  }

  filterTasks(): void {
    // Filtering is handled by computed signals
    // This method triggers change detection
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortOrder = 'ASC';
    }
    this.loadTasks();
  }

  // Modal methods
  openCreateModal(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      category: TaskCategory.WORK,
      dueDate: null
    });
    this.showModal.set(true);
  }

  openEditModal(task: ITask): void {
    this.editingTask.set(task);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  saveTask(): void {
    if (this.taskForm.invalid) return;
    
    this.isSaving.set(true);
    const formValue = this.taskForm.value;
    
    // Format due date if present
    if (formValue.dueDate) {
      formValue.dueDate = new Date(formValue.dueDate).toISOString();
    }
    
    const editing = this.editingTask();
    
    if (editing) {
      // Update existing task
      this.tasksService.updateTask(editing.id, formValue).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTasks();
            this.closeModal();
          }
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Failed to update task', err);
          this.isSaving.set(false);
        }
      });
    } else {
      // Create new task
      this.tasksService.createTask(formValue).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTasks();
            this.closeModal();
          }
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Failed to create task', err);
          this.isSaving.set(false);
        }
      });
    }
  }

  deleteTask(task: ITask): void {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    
    this.tasksService.deleteTask(task.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTasks();
        }
      },
      error: (err) => console.error('Failed to delete task', err)
    });
  }

  updateTaskStatus(task: ITask, newStatus: string): void {
    this.tasksService.updateTask(task.id, { status: newStatus as TaskStatus }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTasks();
        }
      },
      error: (err) => console.error('Failed to update task status', err)
    });
  }

  // Drag and Drop
  onDragStart(event: DragEvent, task: ITask): void {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedTask = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, newStatus: string): void {
    event.preventDefault();
    
    if (this.draggedTask && this.draggedTask.status !== newStatus) {
      this.updateTaskStatus(this.draggedTask, newStatus);
    }
    this.draggedTask = null;
  }

  // Helpers
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  isOverdue(date: string | Date): boolean {
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  }
}
