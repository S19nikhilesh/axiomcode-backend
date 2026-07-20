const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'harmless-hornet-169897.upstash.io',
        port: 6379,
        tls:true,
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