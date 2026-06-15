import 'dotenv/config';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

async function main() {
  const patterns = ['master_mill*', 'service-report*', 'reports:*'];
  let totalDeleted = 0;
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Deleted ${keys.length} key(s) for "${pattern}":`, keys);
      totalDeleted += keys.length;
    } else {
      console.log(`No keys for "${pattern}"`);
    }
  }
  console.log(`\nTotal deleted: ${totalDeleted} key(s)`);
}

main().catch(console.error).finally(() => redis.quit());
