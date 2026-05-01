const express=require('express')
const submitRouter=express.Router();
const rateLimiter=require("../middlewares/rateLimiter");
const {submitCode,runCode}=require("../controllers/userSubmission")

const userMiddleware=require('../middlewares/userMiddleware')
submitRouter.post('/submit/:id', rateLimiter, userMiddleware, submitCode);
submitRouter.post('/run/:id', rateLimiter, userMiddleware, runCode);
module.exports=submitRouter