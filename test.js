const redis = require('redis');

const client = redis.createClient({
    host: '192.168.0.121', // Redis server host
    port: 6379, // Redis server port
    // password: 'your_password', // Uncomment this line if your Redis server requires authentication
  });

  client.on('connect', async () => {
    console.log('Connected to Redis');
    await client.quit()
  });
  
  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });