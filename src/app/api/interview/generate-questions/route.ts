import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, company, interviewType, questionCount = 5 } = await request.json();

    if (!jobTitle) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `Generate ${questionCount} ${interviewType} interview questions for a ${jobTitle} position at ${company}. 

Return a JSON array of questions with this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "The actual interview question text",
      "type": "${interviewType}",
      "followUp": ["optional follow-up question 1", "optional follow-up question 2"]
    }
  ]
}

Make the questions:
- Realistic and commonly asked in actual interviews
- Appropriate for the ${jobTitle} role
- Progressively more challenging
- Mix of different question styles (tell me about, describe a time, how would you, etc.)

Focus on ${interviewType} questions specifically.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert interviewer who creates realistic, professional interview questions. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview questions' },
      { status: 500 }
    );
  }
}