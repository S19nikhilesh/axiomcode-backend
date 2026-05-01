const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-12296.c264.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 12296,
        // Cloud Redis ke liye zaroori settings
        reconnectStrategy: (retries) => {
            console.log(`Redis reconnecting... Attempt: ${retries}`);
            return Math.min(retries * 100, 3000); // 3 seconds max gap
        },
        connectTimeout: 10000, // 10 seconds timeout
        keepAlive: 5000       // Connection ko zinda rakhne ke liye
    }
});


redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.code || err);
    
});


module.exports = redisClient;