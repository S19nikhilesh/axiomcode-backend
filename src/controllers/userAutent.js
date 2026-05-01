const User= require('../models/users');
const Submission=require('../models/submission')
const validate=require('../utils/validator')
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const redisClient=require('../config/redis');

const register= async(req,res)=>{
    try{

        //valdiate toh karway ahi nhi , pehle validator banao 
        validate(req.body)

        const {firstName,emailId,password}=req.body;
        //bina hashing ke password store hota hai kya be? 
        req.body.password=await bcrypt.hash(password,10);
        req.body.role="user";
        //if email alredy exixts yeh khud hi error fenk dega    
        const user= await User.create(req.body);
        //token bhi generate karwa de jwt.sign({emailId},"secet_key",{expiresIn: 60*60});
        const token=jwt.sign({_id:user._id,emailId:emailId,role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie("token",token,{maxAge: 60*60*1000 });
        // res.status(201).send("User Registered Successfully");
            //par kya faida sirf user login succesfully bhejne ka , hum ek extra call bcha skte hai as user login ,send user data
            const reply={
                firstName:user.firstName,
                emailId:user.emailId,
                _id:user._id
            }
            res.status(201).json({
                user:reply,
                message:"Registered Successfully"
            })
        //new resource created status:201

    }catch(err){
        res.status(400).send("Error:"+err);// status code 400: bad request 
    }
}
const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId });

        // If user doesn't exist, throw error immediately
        if (!user) throw new Error("Invalid Credentials");

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error("Invalid Credentials");

        const token = jwt.sign(
            { _id: user._id, emailId: emailId, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );

        res.cookie("token", token, { maxAge: 60 * 60 * 1000, httpOnly: true });

        res.status(200).json({
            user: {
                firstName: user.firstName,
                emailId: user.emailId,
                _id: user._id,
                role: user.role // Important for your Admin button logic!
            },
            message: "Login Successfully"
        });

    } catch (err) {
        // Send a clean JSON object instead of a string
        // Using err.message removes the "Error:" prefix
        res.status(401).json({ message: err.message });
    }
};

const logout=async(req,res)=>{
    try{
        //validate the token -middleware se hogya


        //add it to redis ka bloaklist
        const {token}=req.cookies;
        const paylaod=jwt.decode(token);

        await redisClient.set(`token:${token}`,"Blocked");
        await redisClient.expireAt(`token:${token}`,paylaod.exp);
        //added  it to redis ka bloacklist

        //clear the coookies
        res.cookie("token",null,{expires:new Date(Date.now())}); // khali token bheja , aur abhi hi expire karde isko 
        res.send("Logged out Successfully");
    }catch(err){
        res.status(401).json({ message: err.message });
    }
}

const adminRegister=async(req,res)=>{
    try{

        //valdiate toh karway ahi nhi , pehle validator banao 
        validate(req.body)

        const {firstName,emailId,password}=req.body;
        //bina hashing ke password store hota hai kya be? 
        req.body.password=await bcrypt.hash(password,10);
       
        //if email alredy exixts yeh khud hi error fenk dega    
        const user= await User.create(req.body);
        //token bhi generate karwa de jwt.sign({emailId},"secet_key",{expiresIn: 60*60});
        // const token=jwt.sign({_id:user._id,emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        // res.cookie("token",token,{maxAge: 60*60*1000 });
        res.status(201).send("New Admin Registered Successfully");
        //new resource created status:201

    }catch(err){
        res.status(400).json({ message: err.message || "Registration failed" });// status code 400: bad request 
    }
}

const deleteProfile=async(req,res)=>{
try{
    const userId=req.result._id;

    await User.findByIdAndDelete(userId);
    await Submission.deleteMany(userId);

    res.status(200).send("Profile Deleted Successfully")


}catch(err){
    res.send(500).send("failed to detete user :"+err)
}
}


module.exports={register,login,logout,adminRegister,deleteProfile}

