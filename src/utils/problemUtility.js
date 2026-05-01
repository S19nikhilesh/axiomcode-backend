const axios = require("axios");
require('dotenv').config();

const getLanguageName = (lang) => {

  if (!lang) {
    throw new Error("Language is missing");
  }
    const languageMap = {
      "c++": "cpp",
      "c": "c",
      "python": "java",
      "java": "java"
    };
  
    return languageMap[lang.toLowerCase()];
};

const getDriverTemplate=(lang,USER_CODE,template_codes)=>{
  if (!template_codes || !Array.isArray(template_codes)) {
    console.error("template_codes is missing or not an array:", template_codes);
    throw new Error("Server configuration error: Template codes not provided.");
  }
    const config = template_codes.find(
      (c) => c.language.toLowerCase() === lang.toLowerCase()
  );

  if (!config) {
      throw new Error(`Configuration not found for language: ${lang}`);
  }

  const driverTemplate = {
    "c++": `
      #include <iostream>
      #include<vector>
      #include <string>
      #include <algorithm> 
      #include <cctype>
      using namespace std;
      ${USER_CODE} 
      int main() {
          int t;
          if(!(cin >> t)) return 0;
          while(t--) {
            ${config.hiddenStartCode || ""}
            ${config.functionCall || ""}
            cout << endl;
          }
          return 0;
      }
    `,
    "c": `
      #include <stdio.h>
      #include <string.h>
      #include <ctype.h>  
      #include <stdlib.h>
  
      ${USER_CODE}
  
      int main() {
          int t;
          if(scanf("%d", &t) != 1) return 0;
  
          while(t--) {
              ${config.hiddenStartCode || ""}
              ${config.functionCall || ""}
              printf("\\n");
          }
          return 0;
      }
    `,
    "java": `
      import java.util.*;
      import java.io.*;
      // User's class/method will be injected here
      ${USER_CODE}
  
      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              if (sc.hasNextInt()) {
                  int t = sc.nextInt();
                  // We create an instance of the Solution class if the user is writing non-static methods
                  Solution sol = new Solution(); 
                  
                  while (t-- > 0) {
                      ${config.hiddenStartCode || ""}
                      ${config.functionCall || ""}
                      System.out.println();
                  }
              }
              sc.close();
          }
      }
    `
  };

  if (!driverTemplate[lang.toLowerCase()]) {
    throw new Error("Driver template not found for language");
  }
  return driverTemplate[lang.toLowerCase()];
  
};


const executeCode = async (combinedInput, language, code,template_codes) => {
  // console.log(language,combinedInput,code)
  const response = await axios.post(
    "https://api.jdoodle.com/v1/execute",
    {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET_KEY,
      script: getDriverTemplate(language,code,template_codes),  
      stdin: combinedInput,
      language: getLanguageName(language),
      versionIndex: "4"
    }
    
  );
 console.log(getLanguageName(language))
 console.log(response.data);
  return response.data;
};

const checkOutput = (submitResult, visibleTestCases) => {
  if (!submitResult || !visibleTestCases) return 0;
  
  // Safety: Ensure output is a string
  const output = String(submitResult.output || ""); 
  const allLines = output.split(/\r?\n/);
  const cleanLines = allLines.map(line => line.trim());

  let passedCount = 0;
  for (let i = 0; i < visibleTestCases.length; i++) {
      // Safety: Ensure database output exists
      const expected = String(visibleTestCases[i].output || "").trim();
      const actual = (cleanLines[i] !== undefined) ? cleanLines[i] : "";

      if (expected === actual) {
          passedCount++;
      } else {
          break; 
      }
  }
  return passedCount;
};


module.exports = {executeCode,checkOutput} ;


//output look like

// {
//   output: '5\n25',
//   error: null,
//   statusCode: 200,
//   memory: '3072',
//   cpuTime: '0.00',
//   compilationStatus: null,
//   projectKey: null,
//   isExecutionSuccess: true,
//   isCompiled: true
// }