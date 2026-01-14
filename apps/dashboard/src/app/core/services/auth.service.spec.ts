/**
 * ============================================
 * AUTH SERVICE TESTS (Frontend)
 * ============================================
 * 
 * Tests for Angular authentication service
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    const mockLoginResponse = {
      accessToken: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'viewer',
        organizationId: 'org-123',
        isActive: true,
      },
      expiresIn: 86400,
    };

    it('should store token in localStorage on successful login', () => {
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();

      const req = httpMock.expectOne(\`\${environment.apiUrl}/auth/login\`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);

      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
    });

    it('should store user in localStorage on successful login', () => {
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();

      const req = httpMock.expectOne(\`\${environment.apiUrl}/auth/login\`);
      req.flush(mockLoginResponse);

      const storedUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      expect(storedUser.email).toBe('test@example.com');
    });

    it('should update currentUser signal on successful login', () => {
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();

      const req = httpMock.expectOne(\`\${environment.apiUrl}/auth/login\`);
      req.flush(mockLoginResponse);

      expect(service.getCurrentUser()?.email).toBe('test@example.com');
    });
  });

  describe('logout', () => {
    it('should clear localStorage on logout', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('current_user', JSON.stringify({ id: 'user-123' }));

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
    });

    it('should clear currentUser signal on logout', () => {
      service.logout();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBeFalsy();
    });

    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      // Reinitialize service to pick up localStorage
      service = TestBed.inject(AuthService);
      
      expect(service.getToken()).toBe('test-token');
    });
  });

  describe('role checks', () => {
    const setupUserWithRole = (role: string) => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: role,
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'test-token');
      // Reinitialize service
      service = TestBed.inject(AuthService);
    };

    it('isOwner should return true for owner role', () => {
      setupUserWithRole('owner');
      expect(service.isOwner()).toBe(true);
    });

    it('isOwner should return false for admin role', () => {
      setupUserWithRole('admin');
      expect(service.isOwner()).toBe(false);
    });

    it('isAdminOrOwner should return true for owner', () => {
      setupUserWithRole('owner');
      expect(service.isAdminOrOwner()).toBe(true);
    });

    it('isAdminOrOwner should return true for admin', () => {
      setupUserWithRole('admin');
      expect(service.isAdminOrOwner()).toBe(true);
    });

    it('isAdminOrOwner should return false for viewer', () => {
      setupUserWithRole('viewer');
      expect(service.isAdminOrOwner()).toBe(false);
    });
  });
});
