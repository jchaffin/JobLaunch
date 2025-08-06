import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { conversation, resumeData, jobData } = await request.json();

    const systemPrompt = `Based on the conversation, resume data, and job requirements, generate insights for interview preparation. Return JSON with:
- strengths: Array of identified strengths
- weaknesses: Array of areas for improvement  
- recommendations: Array of specific recommendations
- practiceAreas: Array of topics to practice`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Generate insights based on:
          
Conversation: ${JSON.stringify(conversation)}
Resume: ${JSON.stringify(resumeData)}
Job: ${JSON.stringify(jobData)}` 
        },
      ],
      response_format: { type: 'json_object' },
    });

    const insights = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Insights generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}