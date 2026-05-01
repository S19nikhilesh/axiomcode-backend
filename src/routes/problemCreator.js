const express=require('express');
const problemRouter=express.Router();
const adminMiddleware=require("../middlewares/adminMiddleware")
const userMiddleware=require("../middlewares/userMiddleware")

const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,getSolvedProblemsByUser,getSubmittedProblems}=require("../controllers/userProblem")

//admin access chahidi hai pehla
problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id",adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);

//user access
problemRouter.get("/ProblemById/:id",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware,getAllProblem);

problemRouter.get("/solvedProblemsByUser",userMiddleware,getSolvedProblemsByUser);
problemRouter.get("/submittedProblems/:pid",userMiddleware,getSubmittedProblems)

module.exports=problemRouter;