import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume data and job description are required' },
        { status: 400 }
      );
    }

    // Calculate resume-to-job match percentage using AI
    const matchAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS and recruitment consultant. Analyze the resume against the job description and provide a detailed match assessment.

Calculate a match percentage based on:
1. Required skills overlap (40% weight)
2. Experience level and relevance (30% weight) 
3. Education requirements (15% weight)
4. Industry keywords and terminology (15% weight)

Return JSON with this exact structure:
{
  "matchPercentage": 85,
  "skillsMatch": {
    "matched": ["skill1", "skill2"],
    "missing": ["skill3", "skill4"],
    "percentage": 75
  },
  "experienceMatch": {
    "relevantYears": 5,
    "requiredYears": 3,
    "levelMatch": "Senior",
    "percentage": 90
  },
  "educationMatch": {
    "meetsRequirements": true,
    "percentage": 100
  },
  "keywordMatch": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["keyword3"],
    "percentage": 80
  },
  "strengths": ["Strong technical background", "Relevant experience"],
  "gaps": ["Missing certification", "No cloud experience"],
  "recommendations": ["Add AWS certification", "Include cloud projects"],
  "improvementPotential": 95
}`,
        },
        {
          role: 'user',
          content: `Analyze this resume against the job description:

RESUME:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Provide detailed match analysis with actionable recommendations.`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const matchData = JSON.parse(matchAnalysis.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      matchAnalysis: matchData,
    });
  } catch (error) {
    console.error('Resume match analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume match' },
      { status: 500 }
    );
  }
}