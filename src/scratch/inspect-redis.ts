import 'dotenv/config';
import IORedis from 'ioredis';

const redisConn = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

async function main() {
  try {
    const keys = await redisConn.keys('*user*');
    console.log('All user-related keys in Redis:', keys);

    for (const key of keys) {
      const type = await redisConn.type(key);
      if (type === 'string') {
        const val = await redisConn.get(key);
        console.log(`Key: ${key} (String) =>`, val);
      } else {
        console.log(`Key: ${key} (${type})`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    redisConn.disconnect();
  }
}

main();
