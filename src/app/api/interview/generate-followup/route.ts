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

    const prompt = `You are an interviewer conducting a ${interviewType} interview for a ${jobTitle} position at ${company}.

The candidate just answered this question: "${currentQuestion.question}"
Their response was: "${userResponse}"

Generate a natural interviewer follow-up response. You can:
1. Acknowledge their answer briefly
2. Ask a clarifying follow-up question to dig deeper
3. Move to the next question if the answer was complete

Return JSON with this structure:
{
  "followUp": "Your natural interviewer response here",
  "moveToNext": boolean (true if ready for next question, false if staying on current topic)
}

Keep your response:
- Professional but conversational
- Under 100 words
- Natural sounding when spoken aloud
- Appropriate for the interview context

Examples of good follow-ups:
- "That's interesting. Can you walk me through how you implemented that solution?"
- "I appreciate that example. Let's move on to our next question."
- "Good answer. Tell me more about the challenges you faced in that situation."`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional interviewer who provides natural, conversational follow-up responses. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.followUp) {
      throw new Error('Invalid response format from OpenAI');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Follow-up generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up response' },
      { status: 500 }
    );
  }
}