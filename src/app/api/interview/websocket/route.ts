import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active sessions
const activeSessions = new Map<string, {
  sessionId: string;
  role: 'interviewer' | 'assistant';
  openaiSession?: any;
  context?: any;
  conversationHistory: Array<{ role: string; content: string; timestamp: number }>;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, role, context } = body;

    console.log(`Starting interview session: ${sessionId}`);

    // Create OpenAI Realtime session
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: role === 'interviewer' ? 'alloy' : 'echo',
        modalities: ['text', 'audio'],
        instructions: getSystemInstructions(role, context),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Realtime API error: ${response.status}`);
    }

    const sessionData = await response.json();
    console.log(`OpenAI Realtime session created: ${sessionData.id}`);

    // Store session
    activeSessions.set(sessionId, {
      sessionId,
      role,
      openaiSession: sessionData,
      context,
      conversationHistory: [],
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionData.id,
      role,
    });

  } catch (error) {
    console.error('Error creating interview session:', error);
    return NextResponse.json(
      { error: 'Failed to create interview session' },
      { status: 500 }
    );
  }
}

function getSystemInstructions(role: 'interviewer' | 'assistant', context: any) {
  if (role === 'interviewer') {
    return `You are an experienced ${context?.interviewType || 'technical'} interviewer conducting a realistic job interview for a ${context?.roleTitle || 'Software Engineer'} position at ${context?.companyName || 'a tech company'}.

CRITICAL INSTRUCTIONS:
1. You are conducting a REAL interview - act naturally and professionally
2. Ask ONE question at a time and wait for the candidate's response
3. Follow up on answers with clarifying questions
4. Ask both technical and behavioral questions appropriate for the role
5. Be encouraging but thorough in your evaluation
6. Keep questions relevant to the job description and role level
7. Do NOT reveal that you are AI - you are a human interviewer
8. Maintain a conversational, professional tone
9. Ask about specific experiences, technical skills, and problem-solving approaches
10. Conclude with questions about the candidate's interest in the role and company

Start with: "Hello! Thank you for taking the time to interview with us today. I'm excited to learn more about your background and experience. Could you please start by telling me a bit about yourself and what interests you about this ${context?.roleTitle || 'position'}?"

Interview Context:
- Company: ${context?.companyName || 'Not specified'}
- Role: ${context?.roleTitle || 'Not specified'}  
- Interview Type: ${context?.interviewType || 'General'}
- Job Description: ${context?.jobDescription || 'Not provided'}

Adapt your questions based on this context and maintain a natural conversation flow.`;
  } else {
    return `You are an intelligent interview assistant helping a job candidate during their interview. Your role is to:

CRITICAL INSTRUCTIONS:
1. Listen to interview questions and provide helpful answer suggestions
2. You CANNOT communicate directly with the interviewer - only assist the candidate
3. Analyze questions for key themes: technical skills, experience, cultural fit, problem-solving
4. Provide structured answer frameworks using methods like STAR (Situation, Task, Action, Result)
5. Suggest specific examples and talking points relevant to the role
6. Give confidence-building tips and remind candidate of their strengths
7. Be concise - candidate needs quick, actionable advice during the interview
8. Focus on helping them demonstrate their qualifications effectively

When you detect a question, respond with:
- Brief analysis of what the interviewer is looking for
- Suggested answer framework or key points to cover
- Specific examples or experiences to mention if available
- Tips for delivery (e.g., "be specific about metrics", "mention leadership aspects")

Interview Context:
- Company: ${context?.companyName || 'Not specified'}
- Role: ${context?.roleTitle || 'Not specified'}
- Interview Type: ${context?.interviewType || 'General'}  
- Job Description: ${context?.jobDescription || 'Not provided'}

Use this context to provide more targeted and relevant suggestions.`;
  }
}

// Handle WebSocket upgrade for real-time communication
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const role = searchParams.get('role') as 'interviewer' | 'assistant';

    if (!sessionId || !role) {
      return new NextResponse('Missing sessionId or role', { status: 400 });
    }

    // In a real implementation, you would upgrade the connection to WebSocket here
    // For now, we'll use server-sent events as a placeholder
    
    return new NextResponse(
      new ReadableStream({
        start(controller) {
          // Send connection confirmation
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'connected', sessionId, role })}\n\n`
            )
          );

          // Send initial message based on role
          if (role === 'interviewer') {
            setTimeout(() => {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    type: 'agent_question',
                    question: "Hello! Thank you for taking the time to interview with us today. I'm excited to learn more about your background and experience. Could you please start by telling me a bit about yourself and what interests you about this position?"
                  })}\n\n`
                )
              );
            }, 1000);
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );

  } catch (error) {
    console.error('WebSocket connection error:', error);
    return new NextResponse('WebSocket connection failed', { status: 500 });
  }
}

// Process audio chunks and messages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, type, data } = body;

    const session = activeSessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    switch (type) {
      case 'audio_chunk':
        // Process audio with OpenAI Realtime API
        console.log(`Processing audio chunk for session: ${sessionId}`);
        // In real implementation, forward to OpenAI Realtime API
        break;

      case 'analyze_question':
        if (session.role === 'assistant') {
          const suggestion = await generateSuggestion(data.question, session.context);
          return NextResponse.json({
            type: 'suggestion',
            suggestion: suggestion.text,
            confidence: suggestion.confidence,
            keyPoints: suggestion.keyPoints,
          });
        }
        break;

      case 'transcription':
        // Handle transcription from OpenAI
        session.conversationHistory.push({
          role: data.speaker,
          content: data.text,
          timestamp: Date.now(),
        });
        
        if (data.text) {
          console.log(`Transcription: ${data.text}`);
        }
        
        return NextResponse.json({ success: true });

      default:
        console.log(`Unknown message type: ${type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing interview message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function generateSuggestion(question: string, context: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an interview coach helping a candidate answer questions effectively. Provide a concise, actionable response suggestion.

Role: ${context?.roleTitle || 'Not specified'}
Company: ${context?.companyName || 'Not specified'}
Interview Type: ${context?.interviewType || 'General'}

Respond with JSON in this format:
{
  "text": "Suggested answer framework or key points",
  "confidence": 0.8,
  "keyPoints": ["point1", "point2", "point3"]
}`
        },
        {
          role: 'user',
          content: `Interview question: "${question}"\n\nProvide a suggestion for how to answer this effectively.`
        }
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      text: result.text || 'Consider using the STAR method to structure your response.',
      confidence: result.confidence || 0.7,
      keyPoints: result.keyPoints || ['Be specific', 'Use examples', 'Show impact'],
    };

  } catch (error) {
    console.error('Error generating suggestion:', error);
    return {
      text: 'Consider using the STAR method: Situation, Task, Action, Result.',
      confidence: 0.6,
      keyPoints: ['Be specific', 'Use examples', 'Show impact'],
    };
  }
}