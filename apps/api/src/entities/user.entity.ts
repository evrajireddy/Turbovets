/**
 * ============================================
 * USER ENTITY
 * ============================================
 * 
 * Database table: users
 * 
 * PRIMARY KEY: userId (UUID)
 * 
 * RELATIONSHIPS:
 * - Many Users belong to One Organization (FK: organizationId)
 * 
 * SECURITY:
 * - Password is hashed with bcrypt before saving
 * - validatePassword() method for login verification
 * 
 * COLUMNS:
 * - userId: Primary key (UUID)
 * - email: Unique email address
 * - password: Bcrypt hashed password
 * - firstName: User's first name
 * - lastName: User's last name
 * - role: OWNER | ADMIN | VIEWER
 * - organizationId: FK to organizations table
 * - isActive: Soft delete flag
 * - createdAt: Timestamp
 * - updatedAt: Timestamp
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '@libs/data';
import { Organization } from './organization.entity';

@Entity('users')
export class User {
  /**
   * PRIMARY KEY
   * Auto-generated UUID for each user
   */
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  /**
   * User's email address (unique)
   * Used for login authentication
   */
  @Column({ unique: true })
  email: string;

  /**
   * Hashed password (bcrypt)
   * Never stored in plain text
   */
  @Column()
  password: string;

  /**
   * User's first name
   */
  @Column({ name: 'first_name' })
  firstName: string;

  /**
   * User's last name
   */
  @Column({ name: 'last_name' })
  lastName: string;

  /**
   * User's role in the system
   * Determines permissions and access level
   */
  @Column({
    type: 'varchar',
    default: Role.VIEWER,
  })
  role: Role;

  /**
   * FOREIGN KEY: Links user to their organization
   * References: organizations.organization_id
   */
  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  /**
   * Organization relationship
   * Many users belong to one organization
   */
  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  /**
   * Active status flag
   * Used for soft delete (false = deleted)
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Timestamp when user was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when user was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  /**
   * Automatically hash password before inserting new user
   * Uses bcrypt with 10 salt rounds
   */
  @BeforeInsert()
  async hashPasswordBeforeInsert(): Promise<void> {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  /**
   * Hash password before update if it was changed
   */
  @BeforeUpdate()
  async hashPasswordBeforeUpdate(): Promise<void> {
    // Only hash if password was modified (not already hashed)
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // ============================================
  // METHODS
  // ============================================

  /**
   * Validate a plain text password against the stored hash
   * @param plainPassword - The password to validate
   * @returns true if password matches, false otherwise
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Get user's full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Convert to safe object (without password)
   */
  toSafeObject(): Omit<User, 'password' | 'validatePassword' | 'hashPasswordBeforeInsert' | 'hashPasswordBeforeUpdate'> {
    const { password, ...safeUser } = this;
    return safeUser as any;
  }
}
