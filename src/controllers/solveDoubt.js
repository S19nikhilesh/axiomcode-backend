const { GoogleGenAI } = require("@google/genai");
const solveDoubt = async (req, res) => {
try {
const { message, title, description, testCases, startCode } = req.body;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

async function main() {
    const response = await ai.models.generateContent({
        // Changed model name to the correct technical format
        model: "gemini-2.5-flash-lite", 
        contents: message,
        config: {
            maxOutputTokens: 500,
            systemInstruction : `
            You are an expert DSA Tutor. Your mission is to help the user complete their coding function. 

            ### PROBLEM DETAILS:
            - **Title:** ${title}
            - **Description:** ${description}
            - **Test Cases:** ${JSON.stringify(testCases)}

            ### CODE ARCHITECTURE (The Three-Box System):
            You have access to the full code structure for this problem. The user only interacts with the "Initial Code".
            - **Start Code Configuration (JSON):** ${JSON.stringify(startCode)}

            ### YOUR SPECIFIC TASK:
            1. **Identify the Language:** Check which language the user is using from the startCode array.
            2. **Target the Function:** Your goal is solely to help the user complete the 'initialCode' function signature found in the startCode array for their specific language.
            3. **Analyze the Plumbing:** Use the 'hiddenStartCode' and 'functionCall' to understand how the function is called, but **NEVER** suggest the user modify or add these parts. 

            ### TUTORIAL GUIDELINES:
            - **Step 1 (The Approach):** First, explain the logic or the algorithm (e.g., "We should use a Hash Map to store frequencies...").
            - **Step 2 (The Hints):** Point out potential bugs or edge cases based on the provided Test Cases.
            - **Step 3 (The Code):** If the user is stuck, provide the completed version of the 'initialCode' function ONLY. 
            - **Strict Restriction:** Do not provide a 'main' function, header files (#include), or class wrappers unless they are already part of the 'initialCode'.
            - **Tone:** Be encouraging, concise, and professional.
            `
        }
    });

    res.status(201).json({
        message: response.text
    });
    console.log(response.text);
}

await main();
} catch (err) {
console.log(err);
res.status(500).json({
    message: "Internal Server Error"
});
}}


module.exports = solveDoubt;