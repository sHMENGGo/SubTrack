// redis_client.js
const Redis = require('ioredis');

const redis_client = new Redis(process.env.REDIS_URL, {
   maxRetriesPerRequest: 3,
});

redis_client.on('error', (err) => console.error('Redis error:', err));
redis_client.on('connect', () => console.log('Redis connected'));



async function get_or_set_cache(key, ttl_seconds, fetch_func) {
   try {
      const cached = await redis_client.get(key);
      if (cached) return JSON.parse(cached);
   } catch (err) {
      console.error('Redis read error:', err);
   }

   const fresh_data = await fetch_func();

   try {
      await redis_client.set(key, JSON.stringify(fresh_data), 'EX', ttl_seconds);
   } catch (err) {
      console.error('Redis write error:', err);
   }

   return fresh_data;
}

async function delete_cache(pattern) {
  try {
    const keys = await redis_client.keys(pattern);
    if (keys.length > 0) {
      await redis_client.del(...keys);
    }
  } catch (err) {
    console.error('Redis deleting cache error:', err);
  }
}

module.exports = { get_or_set_cache, delete_cache };