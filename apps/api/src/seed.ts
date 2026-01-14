/**
 * ============================================
 * DATABASE SEED SCRIPT
 * ============================================
 * 
 * Populates the database with demo data.
 * Run with: npm run seed
 * 
 * CREATED DATA:
 * - 3 Organizations (1 parent, 2 children)
 * - 4 Users (1 owner, 2 admins, 1 viewer)
 * - 10 Sample Tasks
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { Role, TaskStatus, TaskPriority, TaskCategory } from '@libs/data';

// Database connection
const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.join(__dirname, '..', '..', '..', 'data', 'app.db'),
  entities: [Organization, User, Task],
  synchronize: true,
  logging: false,
});

async function seed() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           DATABASE SEED SCRIPT                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Ensure data directory exists
  const dataDir = path.join(__dirname, '..', '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }

  try {
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    const orgRepo = dataSource.getRepository(Organization);
    const userRepo = dataSource.getRepository(User);
    const taskRepo = dataSource.getRepository(Task);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await taskRepo.delete({});
    await userRepo.delete({});
    await orgRepo.delete({});
    console.log('✅ Data cleared\n');

    // ========================================
    // CREATE ORGANIZATIONS
    // ========================================
    console.log('🏢 CREATING ORGANIZATIONS');
    console.log('─────────────────────────');

    const techCorp = orgRepo.create({
      name: 'TechCorp',
      description: 'Main parent organization',
      parentId: null,
    });
    await orgRepo.save(techCorp);
    console.log(`   ✅ TechCorp (Parent) - ID: ${techCorp.organizationId}`);

    const engineering = orgRepo.create({
      name: 'Engineering Department',
      description: 'Software development team',
      parentId: techCorp.organizationId,
    });
    await orgRepo.save(engineering);
    console.log(`   ✅ Engineering (Child) - ID: ${engineering.organizationId}`);

    const marketing = orgRepo.create({
      name: 'Marketing Department',
      description: 'Marketing and sales team',
      parentId: techCorp.organizationId,
    });
    await orgRepo.save(marketing);
    console.log(`   ✅ Marketing (Child) - ID: ${marketing.organizationId}`);
    console.log('');

    // ========================================
    // CREATE USERS
    // ========================================
    console.log('👤 CREATING USERS');
    console.log('─────────────────');

    const hashPassword = async (password: string): Promise<string> => {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    };

    const owner = userRepo.create({
      email: 'owner@techcorp.com',
      password: await hashPassword('Owner123!'),
      firstName: 'John',
      lastName: 'Smith',
      role: Role.OWNER,
      organizationId: techCorp.organizationId,
      isActive: true,
    });
    await userRepo.save(owner);
    console.log(`   ✅ owner@techcorp.com (OWNER) - ID: ${owner.userId}`);

    const engAdmin = userRepo.create({
      email: 'admin@engineering.com',
      password: await hashPassword('Admin123!'),
      firstName: 'Alice',
      lastName: 'Johnson',
      role: Role.ADMIN,
      organizationId: engineering.organizationId,
      isActive: true,
    });
    await userRepo.save(engAdmin);
    console.log(`   ✅ admin@engineering.com (ADMIN) - ID: ${engAdmin.userId}`);

    const engViewer = userRepo.create({
      email: 'viewer@engineering.com',
      password: await hashPassword('Viewer123!'),
      firstName: 'Bob',
      lastName: 'Williams',
      role: Role.VIEWER,
      organizationId: engineering.organizationId,
      isActive: true,
    });
    await userRepo.save(engViewer);
    console.log(`   ✅ viewer@engineering.com (VIEWER) - ID: ${engViewer.userId}`);

    const mktAdmin = userRepo.create({
      email: 'admin@marketing.com',
      password: await hashPassword('Admin123!'),
      firstName: 'Carol',
      lastName: 'Davis',
      role: Role.ADMIN,
      organizationId: marketing.organizationId,
      isActive: true,
    });
    await userRepo.save(mktAdmin);
    console.log(`   ✅ admin@marketing.com (ADMIN) - ID: ${mktAdmin.userId}`);
    console.log('');

    // ========================================
    // CREATE TASKS
    // ========================================
    console.log('📋 CREATING TASKS');
    console.log('─────────────────');

    // Engineering tasks
    const engineeringTasks = [
      { title: 'Implement user authentication', status: TaskStatus.DONE, priority: TaskPriority.HIGH },
      { title: 'Create database schema', status: TaskStatus.DONE, priority: TaskPriority.HIGH },
      { title: 'Build REST API endpoints', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH },
      { title: 'Write unit tests', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
      { title: 'Setup CI/CD pipeline', status: TaskStatus.TODO, priority: TaskPriority.LOW },
    ];

    for (let i = 0; i < engineeringTasks.length; i++) {
      const task = taskRepo.create({
        ...engineeringTasks[i],
        description: `Task for engineering team`,
        category: TaskCategory.WORK,
        position: i + 1,
        userId: engAdmin.userId,  // Foreign key to user
        organizationId: engineering.organizationId,
      });
      await taskRepo.save(task);
      console.log(`   ✅ ${task.title} (Engineering)`);
    }

    // Marketing tasks
    const marketingTasks = [
      { title: 'Create product brochure', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH },
      { title: 'Plan social media campaign', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
      { title: 'Update website content', status: TaskStatus.TODO, priority: TaskPriority.LOW },
    ];

    for (let i = 0; i < marketingTasks.length; i++) {
      const task = taskRepo.create({
        ...marketingTasks[i],
        description: `Task for marketing team`,
        category: TaskCategory.WORK,
        position: i + 1,
        userId: mktAdmin.userId,  // Foreign key to user
        organizationId: marketing.organizationId,
      });
      await taskRepo.save(task);
      console.log(`   ✅ ${task.title} (Marketing)`);
    }

    // Owner tasks
    const ownerTasks = [
      { title: 'Quarterly business review', status: TaskStatus.TODO, priority: TaskPriority.URGENT },
      { title: 'Review department budgets', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH },
    ];

    for (let i = 0; i < ownerTasks.length; i++) {
      const task = taskRepo.create({
        ...ownerTasks[i],
        description: `Company-wide task`,
        category: TaskCategory.WORK,
        position: i + 1,
        userId: owner.userId,  // Foreign key to user
        organizationId: techCorp.organizationId,
      });
      await taskRepo.save(task);
      console.log(`   ✅ ${task.title} (TechCorp)`);
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                 SEED COMPLETE!                           ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║                                                          ║');
    console.log('║  📊 Summary:                                             ║');
    console.log('║     • 3 Organizations (1 parent, 2 children)             ║');
    console.log('║     • 4 Users (1 owner, 2 admins, 1 viewer)              ║');
    console.log('║     • 10 Tasks                                           ║');
    console.log('║                                                          ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  🔐 LOGIN CREDENTIALS:                                   ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Email                      Password       Role          ║');
    console.log('║  ─────────────────────────  ────────────   ──────        ║');
    console.log('║  owner@techcorp.com         Owner123!      OWNER         ║');
    console.log('║  admin@engineering.com      Admin123!      ADMIN         ║');
    console.log('║  admin@marketing.com        Admin123!      ADMIN         ║');
    console.log('║  viewer@engineering.com     Viewer123!     VIEWER        ║');
    console.log('║                                                          ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  🚀 NEXT STEPS:                                          ║');
    console.log('║     1. Start API: npm run start:api                      ║');
    console.log('║     2. Start Dashboard: npm run start:dashboard          ║');
    console.log('║     3. Open: http://localhost:4200                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
