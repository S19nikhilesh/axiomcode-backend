const jwt=require("jsonwebtoken");
const User = require("../models/users");
const redisClient = require("../config/redis");

const rateLimiter=async (req,res,next) => {
    const key=`IP:${req.ip}`
    const current_time=Date.now();
    const window_size=60000; //1 min kaa 
    const max_req=3;

    try{
        const window_start_time=current_time-window_size;
        await redisClient.zRemRangeByScore(key,0,window_start_time);
        const request_count=await redisClient.zCard(key);

        if(request_count>=max_req){
            return res.status(429).json({
                success: false,
                message: "Too many requests! 1 minute mein sirf 3 allowed hain.",
                retry_after: "Wait for the window to slide"
            });
        }

        const unique_value=`${current_time}_${Math.random().toString(36).substring(2, 7)}`;
        await redisClient.zAdd(key, {
            score: current_time,
            value: unique_value
        });

        await redisClient.expire(key, 61);
        next();

    }catch(err){
        console.error("Redis Error:", err);
        next();
    }
}

module.exports=rateLimiter