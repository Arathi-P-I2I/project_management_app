import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logInfo, logError } from './logger';

const prisma = new PrismaClient();

async function main() {
  try {
    logInfo('Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.upsert({
      where: { email: 'admin@projectmanagement.com' },
      update: {},
      create: {
        email: 'admin@projectmanagement.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        permissions: ['*'],
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        isActive: true,
        emailVerified: true
      }
    });

    // Create manager user
    const managerPassword = await bcrypt.hash('manager123', 12);
    const manager = await prisma.user.upsert({
      where: { email: 'manager@projectmanagement.com' },
      update: {},
      create: {
        email: 'manager@projectmanagement.com',
        password: managerPassword,
        firstName: 'Project',
        lastName: 'Manager',
        role: 'MANAGER',
        permissions: ['project:create', 'project:read', 'project:update', 'task:create', 'task:read', 'task:update'],
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en'
        },
        isActive: true,
        emailVerified: true
      }
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'user@projectmanagement.com' },
      update: {},
      create: {
        email: 'user@projectmanagement.com',
        password: userPassword,
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        permissions: ['project:read', 'task:read', 'task:update'],
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        isActive: true,
        emailVerified: true
      }
    });

    // Create sample project
    const project = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete redesign of the company website with modern UI/UX',
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        budget: 50000.00,
        managerId: manager.id,
        teamMembers: [user.id],
        tags: ['design', 'frontend', 'ui/ux']
      }
    });

    // Create sample tasks
    const task1 = await prisma.task.create({
      data: {
        title: 'Design Homepage',
        description: 'Create wireframes and mockups for the homepage',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: user.id,
        projectId: project.id,
        estimatedHours: 16.0,
        dueDate: new Date('2024-02-15'),
        tags: ['design', 'wireframes']
      }
    });

    await prisma.task.create({
      data: {
        title: 'Implement Navigation',
        description: 'Build responsive navigation component',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: user.id,
        projectId: project.id,
        estimatedHours: 8.0,
        dueDate: new Date('2024-02-20'),
        tags: ['frontend', 'react']
      }
    });

    // Create sample milestone
    await prisma.milestone.create({
      data: {
        name: 'Design Phase Complete',
        description: 'All design mockups and wireframes completed',
        projectId: project.id,
        dueDate: new Date('2024-02-28'),
        dependencies: []
      }
    });

    // Create sample time entry
    await prisma.timeEntry.create({
      data: {
        userId: user.id,
        taskId: task1.id,
        projectId: project.id,
        description: 'Working on homepage wireframes',
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T17:00:00Z'),
        durationMinutes: 480,
        category: 'Design',
        tags: ['wireframes', 'homepage'],
        isApproved: true,
        approvedBy: manager.id,
        approvedAt: new Date('2024-01-16T09:00:00Z')
      }
    });

    // Create sample comment
    await prisma.comment.create({
      data: {
        content: 'Great progress on the wireframes! The layout looks clean and modern.',
        userId: manager.id,
        projectId: project.id,
        taskId: task1.id,
        mentions: [user.id]
      }
    });

    logInfo('Database seeded successfully!', {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      milestones: await prisma.milestone.count(),
      timeEntries: await prisma.timeEntry.count(),
      comments: await prisma.comment.count()
    });

    logInfo('Test Accounts created', {
      admin: 'admin@projectmanagement.com / admin123',
      manager: 'manager@projectmanagement.com / manager123',
      user: 'user@projectmanagement.com / user123'
    });

  } catch (e) {
    logError('Seeding failed', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    logError('Seeding failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 