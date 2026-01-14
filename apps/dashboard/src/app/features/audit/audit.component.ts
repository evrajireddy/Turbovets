/**
 * ============================================
 * AUDIT LOG COMPONENT
 * ============================================
 * 
 * View system activity logs (Owner/Admin only).
 * Shows login attempts, CRUD operations, access denials.
 * 
 * ACCESS CONTROL:
 * - Only Owner and Admin roles can view
 * - Filterable by action, user, date range
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IAuditLog, IApiResponse, IPaginatedResponse } from '@libs/data';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Page Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Audit Log
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track system activity and security events
              </p>
            </div>
            
            <!-- Filters -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Action Filter -->
              <select [(ngModel)]="selectedAction"
                      (ngModelChange)="loadLogs()"
                      class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 
                             dark:text-white text-sm">
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="ACCESS_DENIED">Access Denied</option>
              </select>

              <!-- Resource Filter -->
              <select [(ngModel)]="selectedResource"
                      (ngModelChange)="loadLogs()"
                      class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 
                             dark:text-white text-sm">
                <option value="">All Resources</option>
                <option value="AUTH">Auth</option>
                <option value="TASK">Task</option>
                <option value="USER">User</option>
                <option value="ORGANIZATION">Organization</option>
              </select>

              <!-- Success Filter -->
              <select [(ngModel)]="selectedSuccess"
                      (ngModelChange)="loadLogs()"
                      class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 
                             dark:text-white text-sm">
                <option value="">All Results</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>

              <!-- Refresh Button -->
              <button (click)="loadLogs()"
                      class="inline-flex items-center px-3 py-2 border border-gray-300 
                             dark:border-gray-600 text-sm font-medium rounded-lg 
                             text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                             hover:bg-gray-50 dark:hover:bg-gray-600">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Refresh
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

        <!-- Stats Cards -->
        <div *ngIf="!isLoading()" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <!-- Total Events -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Events
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ logs().length }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Successful -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Successful
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ successCount() }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Failed -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Failed
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ failedCount() }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Events -->
          <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Security Events
                    </dt>
                    <dd class="text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ securityCount() }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Logs Table -->
        <div *ngIf="!isLoading()" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                             uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                             uppercase tracking-wider">
                    Action
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                             uppercase tracking-wider">
                    Resource
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                             uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                             uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 
                             uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngFor="let log of logs()"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    [class.bg-red-50]="!log.success"
                    [class.dark:bg-red-900/20]="!log.success">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(log.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getActionBadgeClass(log.action)"
                          class="px-2 py-1 text-xs font-medium rounded-full">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ log.resource }}
                    <span *ngIf="log.resourceId" class="text-gray-400 dark:text-gray-500">
                      #{{ log.resourceId | slice:0:8 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ log.userEmail || 'Anonymous' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span *ngIf="log.success"
                          class="px-2 py-1 text-xs font-medium rounded-full 
                                 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Success
                    </span>
                    <span *ngIf="!log.success"
                          class="px-2 py-1 text-xs font-medium rounded-full 
                                 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      Failed
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    <span *ngIf="log.errorMessage" class="text-red-500">
                      {{ log.errorMessage }}
                    </span>
                    <span *ngIf="!log.errorMessage && log.details">
                      {{ formatDetails(log.details) }}
                    </span>
                    <span *ngIf="!log.errorMessage && !log.details" class="text-gray-300 dark:text-gray-600">
                      -
                    </span>
                  </td>
                </tr>
                
                <tr *ngIf="logs().length === 0">
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>No audit logs found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div *ngIf="logs().length > 0" 
               class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 
                      sm:px-6 flex items-center justify-between">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Showing {{ logs().length }} entries
            </div>
            <div class="flex space-x-2">
              <button [disabled]="currentPage === 1"
                      (click)="loadPage(currentPage - 1)"
                      class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                             text-sm disabled:opacity-50 disabled:cursor-not-allowed
                             hover:bg-gray-50 dark:hover:bg-gray-700">
                Previous
              </button>
              <button (click)="loadPage(currentPage + 1)"
                      class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded 
                             text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AuditComponent implements OnInit {
  isLoading = signal(true);
  logs = signal<IAuditLog[]>([]);
  
  // Filters
  selectedAction = '';
  selectedResource = '';
  selectedSuccess = '';
  currentPage = 1;
  pageSize = 50;

  // Computed stats
  successCount = signal(0);
  failedCount = signal(0);
  securityCount = signal(0);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    
    let url = `${environment.apiUrl}/audit-log?limit=${this.pageSize}&page=${this.currentPage}`;
    
    if (this.selectedAction) {
      url += `&action=${this.selectedAction}`;
    }
    if (this.selectedResource) {
      url += `&resource=${this.selectedResource}`;
    }
    if (this.selectedSuccess) {
      url += `&success=${this.selectedSuccess}`;
    }
    
    this.http.get<IApiResponse<IAuditLog[]>>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.logs.set(response.data);
          this.calculateStats(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit logs', err);
        this.isLoading.set(false);
      }
    });
  }

  loadPage(page: number): void {
    this.currentPage = page;
    this.loadLogs();
  }

  calculateStats(logs: IAuditLog[]): void {
    this.successCount.set(logs.filter(l => l.success).length);
    this.failedCount.set(logs.filter(l => !l.success).length);
    this.securityCount.set(logs.filter(l => 
      l.action === 'LOGIN_FAILED' || 
      l.action === 'ACCESS_DENIED'
    ).length);
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'LOGIN_FAILED':
      case 'ACCESS_DENIED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'DELETE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDetails(details: any): string {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    try {
      return JSON.stringify(details).slice(0, 50) + '...';
    } catch {
      return '-';
    }
  }
}
