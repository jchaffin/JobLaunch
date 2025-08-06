import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userResponse, currentQuestion, jobTitle, company, interviewType } = await request.json();

    if (!userResponse || !currentQuestion) {
      return NextResponse.json({ error: 'User response and current question are required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `You are an AI interview coach. A candidate is practicing for a ${interviewType} interview for a ${jobTitle} position at ${company}.

The interviewer asked: "${currentQuestion}"
The candidate is currently responding: "${userResponse}"

Generate 2-3 helpful response suggestions that would improve their answer. Make them:
- Specific and actionable
- Relevant to the question and role
- Professional but conversational
- Under 50 words each

Return JSON with this structure:
{
  "suggestions": [
    "Suggestion 1 text here",
    "Suggestion 2 text here", 
    "Suggestion 3 text here"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach who provides helpful, actionable suggestions. Always respond with valid JSON."
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
    
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Suggestions generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}