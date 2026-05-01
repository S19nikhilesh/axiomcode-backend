const express= require('express');
const app=express();
require('dotenv').config();
const main=require('./config/db');
const cors=require('cors')

const authRouter=require("./routes/userAuth")
const problemRouter=require("./routes/problemCreator")
const aiRouter=require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const cookieParser = require('cookie-parser');
const redisClient=require("./config/redis");
const submitRouter = require('./routes/submit');

app.use(cors({
 origin:'http://localhost:5173',// '*' anyone can access
 credentials:true
}))
app.set('trust proxy', true); //taaki har baar proxy ka Ip nhi bheje rate limiter ko

app.use(express.json());
app.use(cookieParser());
app.use("/video",videoRouter);
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);

const InitializeConnection=async () => {
    try{

        await Promise.all([main(),redisClient.connect()])//parallely coonect krwa diya
        console.log("Connected to both DB");

        app.listen(process.env.PORT,()=>{
                    console.log("Server Listening at PORT number:"+ process.env.PORT);
                }
        )
    }catch(err){
        console.error("Failed to start server:", err);
}
}

InitializeConnection();

