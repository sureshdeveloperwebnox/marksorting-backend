import { Redis } from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

async function main() {
  console.log('Fetching completed BullMQ jobs from Redis...\n');
  
  // ZSET for completed jobs
  const jobIds = await redis.zrange('bull:whatsapp:completed', 0, -1);
  console.log(`Found ${jobIds.length} completed jobs in "whatsapp" queue.`);

  for (const jobId of jobIds) {
    const jobKey = `bull:whatsapp:jobs:${jobId}`;
    const jobData = await redis.hgetall(jobKey);
    
    if (Object.keys(jobData).length === 0) {
      console.log(`Job ${jobId} not found in Redis (might have been cleaned up)`);
      continue;
    }

    const name = jobData.name;
    const data = JSON.parse(jobData.data || '{}');
    const processedOn = jobData.processedOn ? new Date(Number(jobData.processedOn)).toISOString() : 'N/A';
    
    console.log(`- Job ID: ${jobId}`);
    console.log(`  Name: ${name}`);
    console.log(`  To: ${data.to}`);
    console.log(`  File: ${data.fileName}`);
    console.log(`  Report ID: ${data.reportId}`);
    console.log(`  Report Type: ${data.reportType}`);
    console.log(`  Processed On: ${processedOn}`);
    console.log('--------------------------------------------------');
  }

  redis.disconnect();
}

main().catch(console.error);
