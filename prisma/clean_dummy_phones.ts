import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting cleanup of invalid/dummy phone numbers...');

  const millPhoneResult = await prisma.mill.updateMany({
    where: {
      phone: { contains: '9876543210' }
    },
    data: {
      phone: null
    }
  });
  console.log(`Updated ${millPhoneResult.count} mills (phone cleared)`);

  const millPhone2Result = await prisma.mill.updateMany({
    where: {
      phone_2: { contains: '9876543210' }
    },
    data: {
      phone_2: null
    }
  });
  console.log(`Updated ${millPhone2Result.count} mills (phone_2 cleared)`);

  const millPhone3Result = await prisma.mill.updateMany({
    where: {
      phone_3: { contains: '9876543210' }
    },
    data: {
      phone_3: null
    }
  });
  console.log(`Updated ${millPhone3Result.count} mills (phone_3 cleared)`);

  const customerResult = await prisma.customer.updateMany({
    where: {
      phone: { contains: '9876543210' }
    },
    data: {
      phone: null
    }
  });
  console.log(`Updated ${customerResult.count} customers (phone cleared)`);

  const masterMillResult = await prisma.masterMill.updateMany({
    where: {
      phone_no: { contains: '9876543210' }
    },
    data: {
      phone_no: null
    }
  });
  console.log(`Updated ${masterMillResult.count} master mills (phone_no cleared)`);

  const srWhatsappResult = await prisma.serviceReport.updateMany({
    where: {
      mill_whatsapp_number: { contains: '9876543210' }
    },
    data: {
      mill_whatsapp_number: ''
    }
  });
  console.log(`Updated ${srWhatsappResult.count} service reports (whatsapp cleared)`);

  const srAuthPhoneResult = await prisma.serviceReport.updateMany({
    where: {
      authorized_person_phone: { contains: '9876543210' }
    },
    data: {
      authorized_person_phone: null
    }
  });
  console.log(`Updated ${srAuthPhoneResult.count} service reports (auth phone cleared)`);

  const irWhatsappResult = await prisma.installationReport.updateMany({
    where: {
      mill_whatsapp_number: { contains: '9876543210' }
    },
    data: {
      mill_whatsapp_number: ''
    }
  });
  console.log(`Updated ${irWhatsappResult.count} installation reports (whatsapp cleared)`);

  const irAuthPhoneResult = await prisma.installationReport.updateMany({
    where: {
      OR: [
        { authorized_person_phone: { contains: '9876543210' } },
        { authorized_person_phone: { contains: '9876500001' } }
      ]
    },
    data: {
      authorized_person_phone: null
    }
  });
  console.log(`Updated ${irAuthPhoneResult.count} installation reports (auth phone cleared)`);

  console.log('Cleanup completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
