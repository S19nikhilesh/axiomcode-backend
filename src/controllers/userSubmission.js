const Submission = require('../models/submission');
const Problem=require('../models/problem');
const {executeCode,checkOutput}=require("../utils/problemUtility");


const submitCode=async (req,res) => {
    try{
        const userId=req.result._id;
        const problemId=req.params.id;
        console.log(problemId)
        const{code,language}=req.body;

        if(!userId||!problemId||!code||!language)
            return res.status(400).send("some fields are missing")
        
        //fetch problem from database 
        const problem= await Problem.findById(problemId);
        
        console.log(problem.title)
        // pehle sirf code ,language store karwa dete hai , pending status mai , aur baad mai fir update krwa denge
        // bcz maan lo koi error aagya kabhi Jdoodle mai , so that's why 

        const submittedResult=await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesTotal:0,
            status:'pending'

        })
        // ab bhejo Jdoodle ko

        let numberOfTestCasesPassed=0;
        let runTime=0;
        let memoryUsage=0;
        let status='accepted';
        let errorMessage=null;
        let output="";
        let detail="";


        const combinedInput =
        problem.hiddenTestCases.length + "\n" +
        problem.hiddenTestCases.map(tc => tc.input).join("\n");

        
        const template_codes=problem.startCode;
        const submitResult=await executeCode(combinedInput,language,code,template_codes);

        if (!submitResult.isCompiled) {
            status = "compile_error";
            errorMessage = submitResult.error || "CompileTime error";
        }
        
        else if (!submitResult.isExecutionSuccess) {
            status = "runtime_error";
            errorMessage = submitResult.error || "RunTime error";
        }
        
        else {
        
            numberOfTestCasesPassed = checkOutput(submitResult, problem.hiddenTestCases);
            const cleanLines = submitResult.output.trim().split("\n").map(l => l.trim()).filter(l => l !== "");
            if (numberOfTestCasesPassed === problem.hiddenTestCases.length) {
                status = "accepted";
                runTime=submitResult.cpuTime;
                memoryUsage=submitResult.memory;
                output=submitResult.output;
            } 
            else {
                status = "wrong_answer";
                const failedIndex = numberOfTestCasesPassed; 
                const failedTestCase = problem.hiddenTestCases[failedIndex];
                
                const userOutput = cleanLines[failedIndex] || "No Output";
                const expectedOutput = failedTestCase.output.trim();
        
                errorMessage = `Wrong Answer at Test Case ${failedIndex + 1}`;
                detail = `Input: ${failedTestCase.input} | Expected: ${expectedOutput} | Your Output: ${userOutput}`;
            }
        }

        submittedResult.testCasesPassed=numberOfTestCasesPassed;
        submittedResult.testCasesTotal=problem.hiddenTestCases.length;
        submittedResult.runTime=runTime;
        submittedResult.memoryUsage=memoryUsage;
        submittedResult.status=status;
        submittedResult.errorMessage=errorMessage;

        await submittedResult.save();
        
        if(!req.result.ProblemSolved.includes(problemId)){
            req.result.ProblemSolved.push(problemId);
            await req.result.save();
        }


        console.log(numberOfTestCasesPassed);

         const results={
            total:problem.hiddenTestCases.length,
            passed:numberOfTestCasesPassed,
            runtime:runTime,
            memoryUsage:memoryUsage,
            status:status,
            output:output,
            error:errorMessage,
            detail:detail
        }
        // res.status(200).send("Given solution added to submission database")
        res.status(200).json({
            results:results,
            message:"Given solution added to submission database"
        })

    }catch(err){
        res.status(500).send( "Internal Server error" +err);
    }
}

const runCode=async (req,res) => {
    try{
        const userId=req.result._id;
        const problemId=req.params.id;
        console.log(problemId)
        const{code,language}=req.body;

        
        let runTime=0;
        let memoryUsage=0;
        let status='accepted';
        let errorMessage=null;
        let numberOfTestCasesPassed=0;
        let output="";
        let detail="";


        if(!userId||!problemId||!code||!language)
            return res.status(400).send("some fields are missing")
        
        //fetch problem from database 
        const problem= await Problem.findById(problemId);
        
        console.log(problem.title)
        

        const combinedInput =
        problem.visibleTestCases.length + "\n" +
        problem.visibleTestCases.map(tc => tc.input).join("\n");

        console.log("hi")
        console.log("Problem StartCode:", problem.startCode);
        const template_codes=problem.startCode;

        
        const submitResult=await executeCode(combinedInput,language,code,template_codes);


        if (!submitResult.isCompiled) {
            status = "compile_error";
            errorMessage = submitResult.error || "CompileTime error";
        }
        
        else if (!submitResult.isExecutionSuccess) {
            status = "runtime_error";
            errorMessage = submitResult.error || "RunTime error";
        }
        
        else {
        
            numberOfTestCasesPassed = checkOutput(submitResult, problem.visibleTestCases);
            const cleanLines = submitResult.output.trim().split("\n").map(l => l.trim()).filter(l => l !== "");
            
            
            if (numberOfTestCasesPassed === problem.visibleTestCases.length) {
                status = "accepted";
                runTime=submitResult.cpuTime;
                memoryUsage=submitResult.memory;
                output=submitResult.output;
            } 
            else {
                status = "wrong_answer";
                const failedIndex = numberOfTestCasesPassed; 
                const failedTestCase = problem.visibleTestCases[failedIndex];
                
                const userOutput = cleanLines[failedIndex] || "No Output";
                const expectedOutput = failedTestCase.output.trim();
        
                errorMessage = `Wrong Answer at Test Case ${failedIndex + 1}`;
                detail = `Input: ${failedTestCase.input} | Expected: ${expectedOutput} | Your Output: ${userOutput}`;
            }
        }
    
      
        
        
        const results={
            total:problem.visibleTestCases.length,
            passed:numberOfTestCasesPassed,
            runtime:runTime,
            memoryUsage:memoryUsage,
            status:status,
            output:output,
            error:errorMessage,
            detail:detail
        }
        
        res.status(200).json({
            results:results,
            message:`Passed ${numberOfTestCasesPassed} / ${problem.visibleTestCases.length} testcases`
        })

    }catch(err){
        res.status(500).send( "Internal Server error" +err);
    }
}

module.exports={submitCode,runCode};