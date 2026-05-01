const Problem=require("../models/problem");
const {executeCode,checkOutput}=require("../utils/problemUtility");
const User=require("../models/users");
const Submission = require("../models/submission");
const adminMiddleware = require("../middlewares/adminMiddleware");
const SolutionVideo = require("../models/solutionVideo")

const createProblem=async(req,res)=>{
    const {title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution,problemCreator}=req.body;

    try{
        const combinedInput =
        visibleTestCases.length + "\n" +
        visibleTestCases.map(tc => tc.input).join("\n");

        
        console.log(combinedInput)
        for (const{language,completeCode} of referenceSolution){
            if (!completeCode || completeCode.trim() === "") continue;
            // 1. FIND the matching config for this specific language from the startCode array
            const config = startCode.find(c => c.language.toLowerCase() === language.toLowerCase());
           

            // 2. Log the CORRECT structure (using variables, not arrays)
            console.log(`--- Validating ${language} ---`);
            console.log(`
                #include <iostream>
                using namespace std;
                
                ${completeCode} 

                int main() {
                    int t; cin >> t;
                    while(t--) {
                        ${config.hiddenStartCode || ""}
                        ${config.functionCall || ""}
                        cout << endl;
                    }
                    return 0;
                }
            `);

            const submitResult=await executeCode(combinedInput,language,completeCode,startCode);
            if (submitResult.statusCode !== 200) {
                return res.status(400).send("Reference solution failed to execute");
            }
   
            const numberOfTestCasesPassed= checkOutput(submitResult,visibleTestCases);
            if (numberOfTestCasesPassed !== visibleTestCases.length) {
                return res.status(400).send(`Reference solution does not match expected outputs ,failed at test case ${numberOfTestCasesPassed} of ${visibleTestCases.length} in language ${language}`);
            }

           
           
        }
        // If reference solution is correct → Save problem
        const userProblem= await Problem.create(
            {...req.body,
            problemCreator:req.result._id
        }) //admin middleware , result mai id store krwa rha tha

        res.status(201).send("Problem Saved Successfully")
    }catch(err){
        res.status(500).send( "Server error" +err);
    }
}
const updateProblem=async(req,res)=>{
    const {id}=req.params
    const {title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution,problemCreator}=req.body;
    console.log("request aai toh hai ", id);
    try{
        if(!id){
            res.status(400).send("Missing Id Field");
        }

        const DsaProblem=await Problem.findById(id);
        if(!DsaProblem){
            res.status(404).send("This id is not present in Server");
        }

        const combinedInput =
        visibleTestCases.length + "\n" +
        visibleTestCases.map(tc => tc.input).join("\n");

        for (const{language,completeCode} of referenceSolution){
            console.log("kuch toh hora update")
            console.log(language)
            const submitResult=await executeCode(combinedInput,language,completeCode,startCode);
            if (submitResult.statusCode !== 200) {
                return res.status(400).send("Reference solution failed to execute");
            }

            const actualOutputs = submitResult.output
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

            for (let i = 0; i < visibleTestCases.length; i++) {
                const expected = visibleTestCases[i].output.trim();
                const actual = (actualOutputs[i] || "").trim();
                console.log(expected,actual)
                if (expected !== actual) {
                   return res.status(400).send("Reference solution does not match expected outputs");
                }
            }

            
        }

        const newProblem= await Problem.findByIdAndUpdate(id,{...req.body},{runValidators:true ,new :true})

       res.status(200).send(newProblem)
    }catch(err){
      res.status(404).send( "Error:" +err);
    }
}
const deleteProblem=async(req,res)=>{
    const {id}=req.params;
    try{
        if(!id){
            res.status(400).send("Missing Id Field");
        }
        const deletedProblem= await Problem.findByIdAndDelete(id);

            if(!deletedProblem)
                return res.status(404).send("Problem not found")
            res.status(200).send("Problem Deleted");
    }catch(err){
        res.status(500).send("Error:"+err)
    }
}
const getProblemById=async(req,res)=>{
    const {id}=req.params;
    try{ 
        if(!id){
            res.status(404).send("Id is Missing");
        }
        console.log(id)
        //const getProblem=await Problem.findById(id);//par yeh toh sara data bhej rhahai hiddentestcase bhi 
        const getProblem=await Problem.findById(id).select(' _id title description difficulty tags hiddenTestCases visibleTestCases startCode referenceSolution');
        if(!getProblem){
            return res.status(404).send("Problem not found")
        }

        const videos = await SolutionVideo.findOne({problemId:id});

        if(videos){   
    
        const responseData = {
         ...getProblem.toObject(),
        secureUrl:videos.secureUrl,
        thumbnailUrl : videos.thumbnailUrl,
        duration : videos.duration,
        } 
  
        return res.status(200).send(responseData);
        }

    res.status(200).send(getProblem);
    }catch(err){
        res.status(500).send("Error:"+err)
    }
}
const getAllProblem=async(req,res)=>{
    try{
       
        const getProblem=await Problem.find({}).select('_id title difficulty tags');// but yeh toh saar problems le aayega ek sath  VIDEO 6:BACKEND
        //this will ruin user experience

        // ?/getAllProblem?page=3&limit=10
        //await Problem.find().skip(no of docs to skip).limit(fixed 10)
        if(getProblem.length==0){
            return res.status(404).send("no problems exists")
        }
        
        res.status(200).send(getProblem);
    }catch(err){
        res.status(500).send("Error:"+err)
    }
}
const getSolvedProblemsByUser=async (req,res) => {
    try{
        const userId=req.result._id;
        // const user=await User.findById(userId).populate("ProblemSolved") // problem solved jisko refere kr rha uski info fetch krke laa
        const user=await User.findById(userId).populate({
            path:"ProblemSolved",
            select:"_id title difficulty tags"
        })
       
    
        
        res.status(200).send(user.ProblemSolved)
    }catch(err){
        res.status(500).send("Server Error");
    }
}
const getSubmittedProblems = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.pid;

        const ans = await Submission.find({ userId, problemId });

        if (ans.length === 0) {
           
            return res.status(200).json([]); 
        }

        // Add RETURN here for safety as well
        return res.status(200).send(ans);

    } catch (err) {
        console.error(err);
       
        return res.status(500).send("Internal Server Error");
    }
}
module.exports={createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,getSolvedProblemsByUser,getSubmittedProblems};


// -d '{
//   "clientId": "your_client_id_here",
//   "clientSecret": "your_client_secret_here",
//   "script": "print(\"Hello, World!\")",
//   "stdin": "",
//   "language": "python3",
//   "versionIndex": "3",
//   "compileOnly": False
// }'
// c , 4 : cpp, 4: java,4 :python ,4

// {
//     "output": "Hello, World!\n",
//     "statusCode": 200,
//     "memory": "1024",
//     "cpuTime": "0.01",
//     "compilationStatus": 0
//   }

