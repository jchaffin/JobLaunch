import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, answer, type, duration } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `As an experienced interview coach, provide constructive feedback on this interview answer:

Question Type: ${type}
Question: ${question}
Answer: ${answer}
Answer Duration: ${duration} seconds

Please provide feedback that includes:
1. Strengths of the answer
2. Areas for improvement
3. Specific suggestions for a stronger response
4. Whether the answer length was appropriate for the question type

Keep the feedback encouraging but honest, and limit to 2-3 sentences for voice delivery.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional interview coach providing concise, actionable feedback on interview answers. Keep feedback encouraging but honest, focusing on specific improvements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const feedback = response.choices[0].message.content || 'No feedback generated';

    return NextResponse.json({ 
      feedback,
      suggestions: extractSuggestions(feedback),
      score: calculateScore(answer, type, duration)
    });

  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}

function extractSuggestions(feedback: string): string[] {
  // Extract actionable suggestions from feedback
  const lines = feedback.split('\n');
  return lines
    .filter(line => line.includes('suggest') || line.includes('improve') || line.includes('consider'))
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function calculateScore(answer: string, type: string, duration: number): number {
  let score = 50; // Base score
  
  // Length considerations
  const wordCount = answer.split(/\s+/).length;
  if (wordCount > 50) score += 10;
  if (wordCount > 100) score += 10;
  if (wordCount > 200) score += 5;
  
  // Duration considerations based on question type
  const expectedDurations = {
    behavioral: 120,
    technical: 300,
    situational: 90,
    company: 60
  };
  
  const expected = expectedDurations[type as keyof typeof expectedDurations] || 120;
  const ratio = duration / expected;
  
  if (ratio >= 0.5 && ratio <= 1.5) score += 15;
  else if (ratio >= 0.3 && ratio <= 2.0) score += 5;
  
  // Structure indicators
  if (answer.includes('situation') || answer.includes('task')) score += 5;
  if (answer.includes('action') || answer.includes('result')) score += 5;
  if (/\d/.test(answer)) score += 5; // Contains numbers/metrics
  
  return Math.min(100, Math.max(0, score));
}