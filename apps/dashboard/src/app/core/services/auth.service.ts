/**
 * ============================================
 * AUTH SERVICE
 * ============================================
 * 
 * Handles all authentication operations:
 * - Login/Logout
 * - Token management
 * - User state
 * 
 * AUTHENTICATION FLOW:
 * --------------------
 *   1. User submits credentials
 *   2. AuthService.login() calls API
 *   3. API returns JWT token
 *   4. Token stored in localStorage
 *   5. User state updated (BehaviorSubject)
 *   6. Auth interceptor adds token to requests
 * 
 * TOKEN STORAGE:
 * --------------
 *   localStorage['auth_token'] = JWT token
 *   localStorage['current_user'] = User object (JSON)
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'viewer';
  organizationId: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  
  // State using signals (Angular 17+)
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal(false);

  // Computed values
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoading = computed(() => this.isLoadingSignal());

  // Legacy BehaviorSubject for compatibility
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  /**
   * Load user from localStorage on startup
   */
  private loadStoredUser(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.setUser(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  /**
   * Set the current user
   */
  private setUser(user: User | null): void {
    this.currentUserSignal.set(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<ApiResponse<LoginResponse>>(
      \`\${this.apiUrl}/auth/login\`,
      credentials
    ).pipe(
      map(response => response.data),
      tap(data => {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        this.setUser(data.user);
        this.isLoadingSignal.set(false);
      })
    );
  }

  /**
   * Register a new user
   */
  register(data: RegisterRequest): Observable<User> {
    this.isLoadingSignal.set(true);

    return this.http.post<ApiResponse<User>>(
      \`\${this.apiUrl}/auth/register\`,
      data
    ).pipe(
      map(response => response.data),
      tap(() => {
        this.isLoadingSignal.set(false);
      })
    );
  }

  /**
   * Logout - clear stored data
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.setUser(null);
  }

  /**
   * Get the stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSignal();
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Check if user is admin or owner
   */
  isAdminOrOwner(): boolean {
    const user = this.currentUserSignal();
    return user?.role === 'admin' || user?.role === 'owner';
  }

  /**
   * Check if user is owner
   */
  isOwner(): boolean {
    return this.currentUserSignal()?.role === 'owner';
  }

  /**
   * Get user's full name
   */
  getUserFullName(): string {
    const user = this.currentUserSignal();
    if (!user) return '';
    return \`\${user.firstName} \${user.lastName}\`;
  }

  /**
   * Refresh user profile from API
   */
  refreshProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(
      \`\${this.apiUrl}/auth/profile\`
    ).pipe(
      map(response => response.data),
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.setUser(user);
      })
    );
  }
}
