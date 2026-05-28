const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for activity_logs.view permission...\n');
  
  // Check if permission exists
  const perm = await prisma.permission.findUnique({
    where: { name: 'activity_logs.view' }
  });
  
  if (perm) {
    console.log('✅ Permission exists:', perm);
  } else {
    console.log('❌ Permission NOT found - creating it...\n');
    
    // Create the permission
    const newPerm = await prisma.permission.create({
      data: {
        name: 'activity_logs.view',
        description: 'View activity logs'
      }
    });
    console.log('✅ Created permission:', newPerm);
    
    // Assign to Super Admin
    const superAdmin = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
    if (superAdmin) {
      await prisma.rolePermission.create({
        data: {
          role_id: superAdmin.id,
          permission_id: newPerm.id
        }
      }).catch(() => console.log('Already assigned to Super Admin'));
      console.log('✅ Assigned to Super Admin');
    }
    
    // Assign to Admin
    const admin = await prisma.role.findUnique({ where: { name: 'Admin' } });
    if (admin) {
      await prisma.rolePermission.create({
        data: {
          role_id: admin.id,
          permission_id: newPerm.id
        }
      }).catch(() => console.log('Already assigned to Admin'));
      console.log('✅ Assigned to Admin');
    }
    
    console.log('\n🎉 Activity Logs permission added successfully!');
    console.log('Refresh the Roles page to see the Activity Logs module.');
  }
  
  // Also check all permissions
  const allPerms = await prisma.permission.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('\n📋 All permissions in database:');
  allPerms.forEach(p => console.log(`  - ${p.name}`));
}

main()
  .catch(e => {
    console.error('Error:', e.message);
    if (e.message.includes('P1001')) {
      console.error('\n❌ Cannot connect to database. Check DATABASE_URL in .env');
    }
  })
  .finally(() => prisma.$disconnect());
