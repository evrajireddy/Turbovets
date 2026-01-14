/**
 * ============================================
 * JWT STRATEGY
 * ============================================
 * 
 * Passport strategy for JWT token validation.
 * Extracts and validates JWT tokens from requests.
 * 
 * JWT TOKEN STRUCTURE:
 * --------------------
 * 
 *   Header:
 *   {
 *     "alg": "HS256",
 *     "typ": "JWT"
 *   }
 *   
 *   Payload:
 *   {
 *     "sub": "user-123",           // User ID
 *     "email": "user@example.com", // User email
 *     "role": "admin",             // User role
 *     "organizationId": "org-456", // User's org
 *     "iat": 1704067200,           // Issued at
 *     "exp": 1704153600            // Expires at
 *   }
 *   
 *   Signature:
 *   HMACSHA256(base64(header) + "." + base64(payload), secret)
 * 
 * VALIDATION FLOW:
 * ----------------
 * 
 *   1. Extract token from Authorization header
 *   2. Decode token (no verification yet)
 *   3. Verify signature using secret
 *   4. Check expiration
 *   5. Call validate() with payload
 *   6. Return user object to attach to request
 * 
 * MOCK EXAMPLE:
 * -------------
 * ```typescript
 * // Request with token
 * GET /tasks
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * // Strategy extracts and validates
 * // Payload extracted: { sub: 'user-123', role: 'admin', ... }
 * 
 * // validate() called
 * // Returns: { id: 'user-123', role: 'admin', organizationId: 'org-456' }
 * 
 * // User attached to request.user
 * ```
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from '@libs/data';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Don't ignore expiration - expired tokens should be rejected
      ignoreExpiration: false,
      
      // Secret key for verification
      // In production, use environment variable
      secretOrKey: process.env.JWT_SECRET || 'development-jwt-secret-key-must-be-at-least-32-characters',
    });
  }

  /**
   * Validate the JWT payload and return user object
   * 
   * This method is called after the token is verified.
   * The returned object is attached to request.user
   * 
   * @param payload - Decoded JWT payload
   * @returns User object to attach to request
   */
  async validate(payload: IJwtPayload) {
    // Validate payload has required fields
    if (!payload.sub || !payload.role || !payload.organizationId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Return user object
    // This will be available as request.user in controllers
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}
