const Redis = require('ioredis');

async function main() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379
  });

  try {
    const keys = await redis.keys('*');
    console.log("All Redis Keys:", keys);

    for (const key of keys) {
      if (key.includes('master_mills')) {
        const val = await redis.get(key);
        console.log(`Key: ${key}`);
        console.log("Val:", val);
      }
    }

    // Let's clear everything related to master_mills
    const mmKeys = await redis.keys('*master_mills*');
    if (mmKeys.length > 0) {
      await redis.del(mmKeys);
      console.log("Cleared master_mills keys:", mmKeys);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await redis.disconnect();
  }
}

main();
