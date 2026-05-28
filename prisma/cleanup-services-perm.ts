import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking for orphaned services permissions...\n');
  
  // Check for any services.* permissions
  const servicePerms = await prisma.permission.findMany({
    where: { name: { startsWith: 'services.' } }
  });
  
  if (servicePerms.length === 0) {
    console.log('No services permissions found - all clean!');
  } else {
    console.log('Found services permissions:', servicePerms.map(p => p.name));
    
    // Delete role permissions first (due to foreign key constraints)
    for (const perm of servicePerms) {
      const deletedRolePerms = await prisma.rolePermission.deleteMany({
        where: { permission_id: perm.id }
      });
      console.log(`Deleted ${deletedRolePerms.count} role permission associations for ${perm.name}`);
    }
    
    // Then delete the permissions
    const deleted = await prisma.permission.deleteMany({
      where: { name: { startsWith: 'services.' } }
    });
    console.log(`\nDeleted ${deleted.count} services permissions`);
  }
  
  console.log('\n✅ Cleanup complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
