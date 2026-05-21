const { Timestamps } = require('bson');
const mongoose=require('mongoose');
const {Schema}=mongoose;

const userSchema=new Schema({
    firstName:{
        type:String,
        required:true,
        minLength:3,
        maxLength:20
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        immutable:true
    },
    age:{
        type:Number,
        min:6,
        max:80
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    ProblemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem'
        }],
    
    },
    potdStreak: {
        type: Number,
        default: 0 // Initial streak zero
    },
    lastPotdSolved: {
        type: Date,
        default: null // Streak valid hai ya nahi, check karne ke liye timestamp
    },
    PotdSolved: [{
        type: Schema.Types.ObjectId,
        ref: 'problem' // Jo tere Problem model ka asali naam hai
    }],
    password:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

const User=mongoose.model("user",userSchema);
module.exports=User;