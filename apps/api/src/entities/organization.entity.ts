/**
 * ============================================
 * ORGANIZATION ENTITY
 * ============================================
 * 
 * Database table: organizations
 * 
 * PRIMARY KEY: organizationId (UUID)
 * 
 * RELATIONSHIPS:
 * - Self-referencing: Parent-Child hierarchy (2 levels max)
 * - One Organization can have many child Organizations
 * - One Organization can have one parent Organization
 * 
 * HIERARCHY RULES:
 * - Maximum 2 levels deep (Parent → Child)
 * - A child organization cannot have children (no grandchildren)
 * - Parent org users can access child org resources
 * - Child org users cannot access parent org resources
 * 
 * COLUMNS:
 * - organizationId: Primary key (UUID)
 * - name: Organization name
 * - description: Optional description
 * - parentId: FK to parent organization (null for root orgs)
 * - createdAt: Timestamp
 * - updatedAt: Timestamp
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  /**
   * PRIMARY KEY
   * Auto-generated UUID for each organization
   */
  @PrimaryGeneratedColumn('uuid', { name: 'organization_id' })
  organizationId: string;

  /**
   * Organization name
   * Example: "TechCorp", "Engineering Department"
   */
  @Column()
  name: string;

  /**
   * Optional description of the organization
   */
  @Column({ nullable: true })
  description: string;

  /**
   * FOREIGN KEY: Links to parent organization
   * References: organizations.organization_id
   * NULL means this is a root/parent organization
   */
  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  /**
   * Parent organization relationship
   * Many child organizations belong to one parent
   */
  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Organization | null;

  /**
   * Child organizations relationship
   * One parent can have many children
   */
  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  /**
   * Timestamp when organization was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when organization was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /**
   * Check if this is a parent (root) organization
   * Parent orgs have no parentId
   */
  get isParentOrg(): boolean {
    return this.parentId === null;
  }

  /**
   * Check if this is a child organization
   * Child orgs have a parentId
   */
  get isChildOrg(): boolean {
    return this.parentId !== null;
  }

  /**
   * Get the hierarchy level
   * 0 = Parent/Root, 1 = Child
   */
  get level(): number {
    return this.parentId === null ? 0 : 1;
  }
}
