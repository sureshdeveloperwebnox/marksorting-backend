import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  const email = 'kator18328@mtupu.com'; // Use the email from the resets log
  const backendUrl = 'http://localhost:4000/api/v1';

  console.log(`Starting password reset test for ${email}...`);

  try {
    // 1. Call forgot-password
    console.log('1. Calling forgot-password endpoint...');
    const forgotRes = await axios.post(`${backendUrl}/auth/forgot-password`, { email });
    console.log('Forgot password response:', forgotRes.data);

    // 2. Fetch the latest reset record from DB to get the raw token if we had it?
    // Wait, we don't have the raw token, but we can query the database to see the latest reset hash
    // Wait, how do we get the token if it's sent to the queue?
    // Let's query the mail queue or mock log!
    // Or wait: we can just check if we can simulate the reset password logic directly by calling the service!
  } catch (error: any) {
    console.error('Error during test:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
