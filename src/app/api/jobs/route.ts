import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  switch (action) {
    case 'search':
      return handleSearch(searchParams);
    case 'applications':
      return handleApplications();
    case 'fetch-from-url':
      return handleFetchFromUrl(searchParams);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'applications':
      return handleCreateApplication(body);
    case 'analyze':
      return handleAnalyze(body);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}





// Handler functions
async function handleSearch(searchParams: URLSearchParams) {
  const query = searchParams.get('query');
  const location = searchParams.get('location');
  
  // Placeholder for search logic
  return NextResponse.json({ jobs: [] });
}

async function handleApplications() {
  // Get all applications
  return NextResponse.json({ applications: [] });
}

async function handleFetchFromUrl(searchParams: URLSearchParams) {
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }
  
  // Placeholder for fetch-from-url logic
  return NextResponse.json({ job: {} });
}

async function handleCreateApplication(body: any) {
  // Placeholder for create application logic
  return NextResponse.json({ success: true, id: 'new-application-id' });
}

async function handleAnalyze(body: any) {
  try {
    const { description, url, jobDescription } = body;

    let jobDescriptionText = description || jobDescription;

    // If URL is provided but no description, try to fetch from URL
    if (url && !jobDescriptionText) {
      console.log('Attempting to fetch job description from URL:', url);
      try {
        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}`);
        }
        
        const htmlContent = await fetchResponse.text();
        
        // Simple text extraction - remove HTML tags and get clean text
        const textContent = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (textContent.length < 100) {
          throw new Error('Insufficient content extracted');
        }
        
        jobDescriptionText = textContent;
        console.log('Successfully extracted job description from URL, length:', jobDescriptionText.length);
        
      } catch (fetchError) {
        console.error('Failed to fetch from URL:', fetchError);
        return NextResponse.json(
          { error: 'Could not fetch job description from URL. Please copy and paste the job description manually.' },
          { status: 400 }
        );
      }
    }

    if (!jobDescriptionText || jobDescriptionText.trim() === '') {
      console.log('Missing job description, received:', { description, jobDescription, body });
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Clean the job description text to remove control characters
    const cleanDescription = jobDescriptionText.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
    
    console.log('Analyzing job description, length:', cleanDescription.length);

    // Analyze job description using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analyze the job description and extract structured data. Return JSON with this exact structure:
{
  "company": "Company Name",
  "role": "Job Title",
  "experience": "3+ years of relevant experience required",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "qualifications": ["qualification1", "qualification2"],
  "experienceLevel": "Entry/Mid/Senior/Executive",
  "requiredYears": 3,
  "location": "City, State",
  "workType": "Remote/Hybrid/Onsite",
  "companyInfo": "Brief company description",
  "keywords": ["keyword1", "keyword2"],
  "sentiment": 0.8
}`,
        },
        {
          role: 'user',
          content: `Analyze this job description and extract all relevant information:\n\n${cleanDescription}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    console.log('Job analysis completed:', analysis);

    return NextResponse.json({
      description: cleanDescription,
      url: url || undefined,
      analysis,
    });
  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
} 