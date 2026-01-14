/**
 * ============================================
 * TASKS SERVICE
 * ============================================
 * 
 * Handles all task-related API operations:
 * - CRUD operations
 * - Filtering and pagination
 * - Drag-and-drop reordering
 * - Statistics
 * 
 * API ENDPOINTS:
 * --------------
 *   GET    /api/tasks          - List tasks
 *   POST   /api/tasks          - Create task
 *   GET    /api/tasks/:id      - Get single task
 *   PUT    /api/tasks/:id      - Update task
 *   DELETE /api/tasks/:id      - Delete task
 *   PUT    /api/tasks/reorder  - Reorder tasks
 *   GET    /api/tasks/stats    - Get statistics
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  position: number;
  createdById: string;
  assignedToId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory = 'WORK' | 'PERSONAL' | 'MEETING' | 'BUG' | 'FEATURE' | 'MAINTENANCE' | 'OTHER';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string;
  assignedToId?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly apiUrl = \`\${environment.apiUrl}/tasks\`;

  // State signals
  tasks = signal<Task[]>([]);
  isLoading = signal(false);
  totalTasks = signal(0);
  stats = signal<TaskStats | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all tasks with optional filters
   */
  getTasks(filters: TaskFilters = {}): Observable<Task[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<ApiResponse<Task[]>>(this.apiUrl, { params }).pipe(
      map(response => {
        this.tasks.set(response.data);
        this.totalTasks.set(response.meta?.total || response.data.length);
        this.isLoading.set(false);
        return response.data;
      })
    );
  }

  /**
   * Get a single task by ID
   */
  getTask(id: string): Observable<Task> {
    return this.http.get<ApiResponse<Task>>(\`\${this.apiUrl}/\${id}\`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create a new task
   */
  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, dto).pipe(
      map(response => response.data),
      tap(task => {
        this.tasks.update(tasks => [task, ...tasks]);
        this.totalTasks.update(n => n + 1);
      })
    );
  }

  /**
   * Update a task
   */
  updateTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.put<ApiResponse<Task>>(\`\${this.apiUrl}/\${id}\`, dto).pipe(
      map(response => response.data),
      tap(updated => {
        this.tasks.update(tasks =>
          tasks.map(t => t.id === id ? updated : t)
        );
      })
    );
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(\`\${this.apiUrl}/\${id}\`).pipe(
      map(() => undefined),
      tap(() => {
        this.tasks.update(tasks => tasks.filter(t => t.id !== id));
        this.totalTasks.update(n => n - 1);
      })
    );
  }

  /**
   * Reorder tasks (drag-and-drop)
   */
  reorderTasks(taskIds: string[]): Observable<Task[]> {
    return this.http.put<ApiResponse<Task[]>>(\`\${this.apiUrl}/reorder\`, { taskIds }).pipe(
      map(response => response.data),
      tap(tasks => {
        this.tasks.set(tasks);
      })
    );
  }

  /**
   * Get task statistics
   */
  getStats(): Observable<TaskStats> {
    return this.http.get<ApiResponse<TaskStats>>(\`\${this.apiUrl}/stats\`).pipe(
      map(response => response.data),
      tap(stats => {
        this.stats.set(stats);
      })
    );
  }

  /**
   * Get tasks grouped by status (for Kanban view)
   */
  getTasksByStatus(): { [key: string]: Task[] } {
    const grouped: { [key: string]: Task[] } = {
      'TODO': [],
      'IN_PROGRESS': [],
      'DONE': [],
      'CANCELLED': [],
    };

    for (const task of this.tasks()) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }

    // Sort by position within each status
    for (const status of Object.keys(grouped)) {
      grouped[status].sort((a, b) => a.position - b.position);
    }

    return grouped;
  }

  /**
   * Quick status update (for drag-drop)
   */
  updateStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(id, { status });
  }
}
