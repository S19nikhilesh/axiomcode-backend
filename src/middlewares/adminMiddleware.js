const jwt=require("jsonwebtoken");
const User = require("../models/users");
const redisClient = require("../config/redis");


const adminMiddleware=async (req,res,next) => {
    try{
        const {token}=req.cookies;
        if(!token)
        throw new Error("Token is not present");
    //user ko dhundho
            const payload=jwt.verify(token,process.env.JWT_KEY);

            const {_id}=payload;

            if(!_id)
                throw new Error("Invalid Token, ID is missing");

            const result=await User.findById(_id);
            if(!result)
                throw new Error("User doesn't Exists");

            if(payload.role!='admin')
                throw new Error("Invalid Token")
            //check redis blocklist
            
        
            const isBlocked=await redisClient.exists(`token:${token}`)

            if(isBlocked)
                throw new Error ("Invalid Token")

            req.result=result;
        
            next();


    }catch(err){
        res.send("Error:"+err.message);
    }
}

module.exports=adminMiddleware;
