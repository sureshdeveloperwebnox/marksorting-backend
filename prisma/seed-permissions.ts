import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Define all permissions for the dashboard modules
const PERMISSIONS = [
  // Dashboard permissions
  { name: 'dashboard.view', description: 'View dashboard' },

  // User Management permissions
  { name: 'users.view', description: 'View users list' },
  { name: 'users.create', description: 'Create new users' },
  { name: 'users.update', description: 'Update user information' },
  { name: 'users.delete', description: 'Delete users' },
  { name: 'users.assign_role', description: 'Assign roles to users' },

  // Role Management permissions
  { name: 'roles.view', description: 'View roles list' },
  { name: 'roles.create', description: 'Create new roles' },
  { name: 'roles.update', description: 'Update role information' },
  { name: 'roles.delete', description: 'Delete roles' },
  { name: 'roles.assign_permissions', description: 'Assign permissions to roles' },

  // Mill Management permissions
  { name: 'mills.view', description: 'View mills list' },
  { name: 'mills.create', description: 'Create new mills' },
  { name: 'mills.update', description: 'Update mill information' },
  { name: 'mills.delete', description: 'Delete mills' },

  // Customer Management permissions
  { name: 'customers.view', description: 'View customers list' },
  { name: 'customers.create', description: 'Create new customers' },
  { name: 'customers.update', description: 'Update customer information' },
  { name: 'customers.delete', description: 'Delete customers' },

  // Service Category permissions
  { name: 'service_categories.view', description: 'View service categories' },
  { name: 'service_categories.create', description: 'Create service categories' },
  { name: 'service_categories.update', description: 'Update service categories' },
  { name: 'service_categories.delete', description: 'Delete service categories' },

  // Service Reports permissions
  { name: 'service_reports.view', description: 'View service reports' },
  { name: 'service_reports.create', description: 'Create service reports' },
  { name: 'service_reports.update', description: 'Update service reports' },
  { name: 'service_reports.delete', description: 'Delete service reports' },
  { name: 'service_reports.export', description: 'Export service reports' },

  // Installation Reports permissions
  { name: 'installation_reports.view', description: 'View installation reports' },
  { name: 'installation_reports.create', description: 'Create installation reports' },
  { name: 'installation_reports.update', description: 'Update installation reports' },
  { name: 'installation_reports.delete', description: 'Delete installation reports' },
  { name: 'installation_reports.export', description: 'Export installation reports' },

  // Expense Management permissions
  { name: 'expenses.view', description: 'View expenses' },
  { name: 'expenses.create', description: 'Create expenses' },
  { name: 'expenses.update', description: 'Update expenses' },
  { name: 'expenses.delete', description: 'Delete expenses' },
  { name: 'expenses.export', description: 'Export expenses' },

  // Expense Category permissions
  { name: 'expense_categories.view', description: 'View expense categories' },
  { name: 'expense_categories.create', description: 'Create expense categories' },
  { name: 'expense_categories.update', description: 'Update expense categories' },
  { name: 'expense_categories.delete', description: 'Delete expense categories' },

  // Store Management permissions
  { name: 'stores.view', description: 'View stores' },
  { name: 'stores.create', description: 'Create stores' },
  { name: 'stores.update', description: 'Update stores' },
  { name: 'stores.delete', description: 'Delete stores' },
  { name: 'stores.export', description: 'Export stores' },

  // Materials Management permissions
  { name: 'materials.view', description: 'View materials' },
  { name: 'materials.create', description: 'Create materials' },
  { name: 'materials.update', description: 'Update materials' },
  { name: 'materials.delete', description: 'Delete materials' },

  // Technicians permissions
  { name: 'technicians.view', description: 'View technicians' },
  { name: 'technicians.create', description: 'Create technicians' },
  { name: 'technicians.update', description: 'Update technicians' },
  { name: 'technicians.delete', description: 'Delete technicians' },

  // Reports permissions
  { name: 'reports.view', description: 'View reports' },
  { name: 'reports.generate', description: 'Generate reports' },
  { name: 'reports.export', description: 'Export reports' },

  // Settings permissions
  { name: 'settings.view', description: 'View settings' },
  { name: 'settings.update', description: 'Update settings' },
  { name: 'settings.company', description: 'Manage company settings' },

  // Ticket Management permissions
  { name: 'tickets.view', description: 'View tickets' },
  { name: 'tickets.create', description: 'Create tickets' },
  { name: 'tickets.update', description: 'Update tickets' },
  { name: 'tickets.delete', description: 'Delete tickets' },
  { name: 'tickets.assign', description: 'Assign tickets' },

  // Notification permissions
  { name: 'notifications.view', description: 'View notifications' },
  { name: 'notifications.manage', description: 'Manage notifications' },
  { name: 'notifications.broadcast', description: 'Broadcast notifications' },

  // Activity Logs permissions
  { name: 'activity_logs.view', description: 'View activity logs' },
];

// Define role configurations
const ROLES = [
  {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: PERMISSIONS.map(p => p.name), // All permissions
  },
  {
    name: 'Admin',
    description: 'Administrative access with most permissions',
    permissions: PERMISSIONS.map(p => p.name).filter(p =>
      !p.includes('roles.') && // Cannot manage roles
      !p.includes('users.assign_role') // Cannot assign admin roles
    ),
  },
  {
    name: 'Manager',
    description: 'Manager access to business modules',
    permissions: [
      'dashboard.view',
      'mills.view', 'mills.create', 'mills.update',
      'customers.view', 'customers.create', 'customers.update',
      'service_categories.view',
      'service_reports.view', 'service_reports.create', 'service_reports.update', 'service_reports.export',
      'installation_reports.view', 'installation_reports.create', 'installation_reports.update', 'installation_reports.export',
      'expenses.view', 'expenses.create', 'expenses.update', 'expenses.export',
      'expense_categories.view',
      'stores.view', 'stores.create', 'stores.update', 'stores.export',
      'materials.view',
      'technicians.view', 'technicians.create', 'technicians.update',
      'reports.view', 'reports.generate', 'reports.export',
      'tickets.view', 'tickets.create', 'tickets.update', 'tickets.assign',
      'notifications.view',
      'activity_logs.view',
    ],
  },
  {
    name: 'Service Engineer',
    description: 'Service engineer with limited permissions',
    permissions: [
      'dashboard.view',
      'mills.view',
      'customers.view',
      'service_categories.view',
      'service_reports.view', 'service_reports.create', 'service_reports.update',
      'installation_reports.view', 'installation_reports.create', 'installation_reports.update',
      'expenses.view', 'expenses.create', 'expenses.update',
      'stores.view',
      'materials.view',
      'technicians.view',
      'tickets.view', 'tickets.update',
      'notifications.view',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to most modules',
    permissions: [
      'dashboard.view',
      'mills.view',
      'customers.view',
      'service_categories.view',
      'service_reports.view',
      'installation_reports.view',
      'expenses.view',
      'expense_categories.view',
      'stores.view',
      'materials.view',
      'technicians.view',
      'reports.view',
      'tickets.view',
      'notifications.view',
    ],
  },
];

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  // Create permissions
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    });
  }

  console.log(`✅ Created ${PERMISSIONS.length} permissions`);

  // Create roles with permissions
  for (const roleConfig of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleConfig.name },
      update: { description: roleConfig.description },
      create: {
        name: roleConfig.name,
        description: roleConfig.description,
      },
    });

    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { role_id: role.id },
    });

    // Assign permissions to role
    for (const permissionName of roleConfig.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permission.id,
          },
        });
      }
    }

    console.log(`✅ Created role: ${roleConfig.name} with ${roleConfig.permissions.length} permissions`);
  }

  // Create default super admin user if not exists
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
  });

  if (superAdminRole) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
      where: { email: 'admin@marksorting.com' },
      update: {},
      create: {
        email: 'admin@marksorting.com',
        full_name: 'Super Admin',
        password_hash: hashedPassword,
        role_id: superAdminRole.id,
        account_status: 'ACTIVE',
        email_verified: true,
      },
    });

    console.log('✅ Created default super admin user (admin@marksorting.com / admin123)');
  }

  console.log('🎉 Permission seeding completed!');
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedPermissions };
