/**
 * ============================================
 * PUBLIC DECORATOR
 * ============================================
 * 
 * Marks an endpoint as publicly accessible (no authentication required).
 * By default, all endpoints require authentication when JwtGuard is applied globally.
 * This decorator allows specific endpoints to bypass authentication.
 * 
 * WHEN TO USE:
 * ------------
 * - Login endpoint (user doesn't have token yet)
 * - Registration endpoint
 * - Password reset request
 * - Health check endpoints
 * - Public API endpoints
 * 
 * USAGE EXAMPLE:
 * --------------
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   
 *   // Public - no auth required
 *   @Public()
 *   @Post('login')
 *   login(@Body() dto: LoginDto) {
 *     return this.authService.login(dto);
 *   }
 *   
 *   // Public - no auth required
 *   @Public()
 *   @Post('register')
 *   register(@Body() dto: RegisterDto) {
 *     return this.authService.register(dto);
 *   }
 *   
 *   // Protected - requires auth (no @Public decorator)
 *   @Post('logout')
 *   logout(@CurrentUser() user: IUser) {
 *     return this.authService.logout(user);
 *   }
 * }
 * ```
 * 
 * HOW IT WORKS:
 * -------------
 * 1. JwtGuard checks for IS_PUBLIC_KEY metadata
 * 2. If found and true, guard allows request without token check
 * 3. If not found, normal JWT validation occurs
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public decorator
 * Marks a route as publicly accessible without authentication
 * 
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
