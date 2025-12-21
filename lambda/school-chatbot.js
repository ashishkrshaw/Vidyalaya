/**
 * AWS Lambda Function: School Chatbot AI Backend
 * 
 * This function receives user queries along with school context
 * and returns AI-powered responses using OpenAI or AWS Bedrock.
 * 
 * Deploy this as an AWS Lambda function with API Gateway trigger.
 */

// Environment variables needed:
// - OPENAI_API_KEY or AWS Bedrock configured
// - Enable CORS in API Gateway

exports.handler = async (event) => {
    // Parse request body
    let body;
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
        return response(400, { error: 'Invalid JSON body' });
    }

    const { message, schoolContext } = body;

    if (!message) {
        return response(400, { error: 'Message is required' });
    }

    // Default school context if not provided
    const context = schoolContext || {
        schoolName: 'Sunrise Public School',
        totalStudents: 0,
        totalFeeCollected: 0,
        pendingDues: 0,
        classesAvailable: ['Nursery', 'KG', '1-12'],
        sections: ['A', 'B', 'C']
    };

    // Build system prompt with school context
    const systemPrompt = `You are a helpful AI assistant for ${context.schoolName}'s School Management System.

SCHOOL INFORMATION:
- School Name: ${context.schoolName}
- Total Students: ${context.totalStudents}
- Total Fee Collected: ₹${context.totalFeeCollected}
- Pending Dues: ₹${context.pendingDues}
- Classes: ${context.classesAvailable?.join(', ') || 'Nursery to 12th'}
- Sections: ${context.sections?.join(', ') || 'A, B, C'}

Your role:
1. Answer questions about the school and its data
2. Help users navigate the student management system
3. Provide information about fees, students, and school policies
4. Be helpful and professional

If asked about statistics or data, use the information provided above.
Keep responses concise and helpful.`;

    try {
        // Option 1: Using OpenAI API
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (OPENAI_API_KEY) {
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await openaiResponse.json();

            if (data.choices && data.choices[0]) {
                return response(200, {
                    reply: data.choices[0].message.content,
                    source: 'openai'
                });
            }
        }

        // Option 2: Using AWS Bedrock (Claude)
        // Uncomment below if using AWS Bedrock instead of OpenAI
        /*
        const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
        
        const client = new BedrockRuntimeClient({ region: 'us-east-1' });
        
        const bedrockBody = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 500,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nUser: ${message}` }
          ]
        };
    
        const command = new InvokeModelCommand({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(bedrockBody)
        });
    
        const bedrockResponse = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        
        return response(200, {
          reply: responseBody.content[0].text,
          source: 'bedrock'
        });
        */

        // Fallback: Return a simple response if no AI service configured
        return response(200, {
            reply: `Hello! I'm the AI assistant for ${context.schoolName}. I can help you with:\n\n📊 **School Stats:**\n• Total Students: ${context.totalStudents}\n• Fee Collected: ₹${context.totalFeeCollected}\n• Pending Dues: ₹${context.pendingDues}\n\nHow can I assist you today?`,
            source: 'fallback'
        });

    } catch (error) {
        console.error('Error:', error);
        return response(500, { error: 'Internal server error', details: error.message });
    }
};

// Helper function for API response
function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify(body)
    };
}

/*
===========================================
DEPLOYMENT INSTRUCTIONS
===========================================

1. CREATE LAMBDA FUNCTION:
   - Go to AWS Lambda Console
   - Create new function
   - Runtime: Node.js 18.x or 20.x
   - Copy this code into index.js

2. SET ENVIRONMENT VARIABLES:
   - OPENAI_API_KEY: Your OpenAI API key

3. CREATE API GATEWAY:
   - Go to API Gateway Console
   - Create HTTP API
   - Add route: POST /chat
   - Integrate with Lambda function
   - Enable CORS

4. GET API ENDPOINT:
   - Copy the API Gateway invoke URL
   - Example: https://abc123.execute-api.us-east-1.amazonaws.com/chat

5. UPDATE FRONTEND:
   - In Chatbot.tsx, replace the Lambda URL with your API endpoint

===========================================
FRONTEND INTEGRATION EXAMPLE
===========================================

// In Chatbot.tsx, update getBotResponse:

const LAMBDA_URL = 'https://YOUR-API-GATEWAY-URL/chat';

const getBotResponse = async (userInput) => {
  // Fetch school context first
  const students = await getAdmissions();
  const feeMap = await loadFeeMap();
  
  const schoolContext = {
    schoolName: localStorage.getItem('schoolName') || 'My School',
    totalStudents: students.length,
    totalFeeCollected: calculateTotalFees(students),
    pendingDues: calculateDues(students, feeMap),
    classesAvailable: ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    sections: ['A', 'B', 'C']
  };

  try {
    const res = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput, schoolContext })
    });
    
    const data = await res.json();
    return data.reply || 'Sorry, I could not process your request.';
  } catch (error) {
    // Fall back to local responses
    return getLocalResponse(userInput);
  }
};

===========================================
*/
