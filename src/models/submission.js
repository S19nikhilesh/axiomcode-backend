const mongoose =require ("mongoose")
const Schema= mongoose.Schema;

const submissionSchema=new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    problemId:{
        type: Schema.Types.ObjectId,
        ref:'problem',
        required:true
    },
    code:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true,
        enum:['c++','c','python']
    },
    status:{
        type:String,
        enum:[
            'pending',
            'accepted',
            'wrong_answer',
            'compile_error',
            'runtime_error',
            'system_error'
        ],
        default:"pending"
    },
    runTime:{
        type:Number,
        default:0
    },
    memoryUsage:{
        type:Number,
        default:0
    },
    errorMessage:{
        type:String,
        default:''
    },
    testCasesPassed:{
        type:Number,
        default:0
    },
    testCasesTotal:{
        type:Number,
        default:0
    }
},{
    timestamps:true
});

submissionSchema.index({userId:1,problemId:1})
const Submission=mongoose.model('Submission',submissionSchema);
module.exports=Submission;

