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
         You are an expert DSA Tutor for the platform Axiom Code. Help the user complete their coding function.

            ### PROBLEM DETAILS:
            - **Title:** ${title}
            - **Description:** ${description}

            ### CODE ARCHITECTURE (The Three-Box System):
            You have access to the full code structure for this problem. The user only interacts with the "Initial Code".
            - **Start Code Configuration (JSON):** ${JSON.stringify(startCode)}

           ### TUTORIAL GUIDELINES:
1. **The Approach:** First, explain the logic/algorithm concisely (e.g., "Use a Hash Map to store frequencies...").
2. **The Hints:** Point out potential bugs or edge cases based on problem constraints.
3. **The Code:** If the user is stuck, provide the completed version of the function signature ONLY.
- **Strict Restriction:** NEVER provide a 'main' function, header (#include)).
 %%strict instruction:**do no include any kind of comments in solution code in program%% . Provide code inside the requested function format only.
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


