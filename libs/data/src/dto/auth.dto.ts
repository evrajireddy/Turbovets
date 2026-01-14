/**
 * ============================================
 * AUTHENTICATION DTOs
 * ============================================
 * 
 * Data Transfer Objects for authentication operations.
 * These DTOs are used for:
 * - Input validation (using class-validator decorators)
 * - Type safety
 * - API documentation
 * 
 * FLOW VISUALIZATION:
 * -------------------
 * 
 *   Client Request              DTO Validation           Controller
 *        │                           │                       │
 *        │   POST /auth/login        │                       │
 *        │   { email, password }     │                       │
 *        │──────────────────────────>│                       │
 *        │                           │  Validate fields      │
 *        │                           │  Check constraints    │
 *        │                           │──────────────────────>│
 *        │                           │                       │  Process
 *        │<──────────────────────────────────────────────────│
 *        │  { accessToken, user }    │                       │
 * 
 * MOCK USAGE EXAMPLE:
 * -------------------
 * ```typescript
 * // In controller
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   // loginDto is already validated
 *   // email: valid email format
 *   // password: string, not empty
 *   return this.authService.login(loginDto);
 * }
 * ```
 */

import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches
} from 'class-validator';
import { Role } from '../enums/role.enum';

/**
 * DTO for user login
 * 
 * @example
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 */
export class LoginDto {
  /**
   * User's email address
   * Must be valid email format
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  /**
   * User's password
   * Must not be empty
   */
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

/**
 * DTO for user registration
 * 
 * @example
 * {
 *   "email": "newuser@example.com",
 *   "password": "SecurePass123!",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "organizationId": "org-123"
 * }
 */
export class RegisterDto {
  /**
   * User's email address
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  /**
   * User's password
   * Must be at least 8 characters
   * Must contain uppercase, lowercase, and number
   */
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  )
  password!: string;

  /**
   * User's first name
   */
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(1, { message: 'First name must be at least 1 character' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName!: string;

  /**
   * User's last name
   */
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(1, { message: 'Last name must be at least 1 character' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName!: string;

  /**
   * Organization ID to assign the user to
   */
  @IsString({ message: 'Organization ID must be a string' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId!: string;

  /**
   * Role to assign (optional, defaults to VIEWER)
   */
  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role specified' })
  role?: Role;
}

/**
 * DTO for token refresh
 */
export class RefreshTokenDto {
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

/**
 * DTO for password change
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    { message: 'Password must contain uppercase, lowercase, and number' }
  )
  newPassword!: string;
}
