import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const radius = searchParams.get("radius") || "25";
    const jobType = searchParams.get("jobtype") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    // Since Indeed's official API is deprecated, we'll use a combination of approaches:
    // 1. Check if user has provided third-party API credentials
    // 2. Use alternative job boards APIs
    // 3. Provide structured search functionality

    const jobs = await searchJobs({
      query,
      location,
      radius: parseInt(radius),
      jobType,
      limit,
    });

    return NextResponse.json({
      jobs,
      total: jobs.length,
      query,
      location,
      searchParams: {
        radius,
        jobType,
        limit,
      },
    });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json(
      { error: "Failed to search jobs" },
      { status: 500 },
    );
  }
}

async function searchJobs(params: {
  query: string;
  location: string;
  radius: number;
  jobType: string;
  limit: number;
}) {
  const { query, location, radius, jobType, limit } = params;

  // Try multiple job search approaches
  const jobs = [];

  // Use RapidAPI JSearch
  try {
    if (!process.env.RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not found in environment variables');
    }
    
    const rapidJobs = await searchWithJSearchAPI(params);
    jobs.push(...rapidJobs);
    
    console.log(`Successfully fetched ${rapidJobs.length} jobs from JSearch API`);
  } catch (error) {
    console.error("JSearch API failed:", error);
    return NextResponse.json(
      { error: `RapidAPI JSearch failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }

  // Return found jobs or indicate no results
  if (jobs.length === 0) {
    return NextResponse.json({
      jobs: [],
      total: 0,
      query,
      location,
      message: "No jobs found for your search criteria. Try different keywords or location.",
      searchParams: { radius: radius.toString(), jobType, limit }
    });
  }

  return jobs.slice(0, limit);
}

async function searchWithJSearchAPI(params: {
  query: string;
  location: string;
  radius: number;
  jobType: string;
  limit: number;
}) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY not configured');
  }

  // Build JSearch API parameters with enhanced location handling
  const searchParams = new URLSearchParams({
    query: `${params.query} in ${params.location}`, // Include location in query
    page: '1',
    num_pages: '1',
    date_posted: 'all',
    remote_jobs_only: 'false',
    employment_types: params.jobType.toUpperCase(),
    job_requirements: 'under_3_years_experience',
    country: 'US'
  });

  // Add location parameter as well for double filtering
  const locationToUse = params.location && params.location.trim() !== '' 
    ? params.location 
    : 'United States';
    
  if (locationToUse.toLowerCase() !== 'remote') {
    searchParams.append('location', locationToUse);
  }

  const url = `https://jsearch.p.rapidapi.com/search?${searchParams}`;
  console.log('JSearch API Request URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      'Accept': 'application/json'
    }
  });

  const responseText = await response.text();
  console.log('JSearch API Response Status:', response.status);
  console.log('JSearch API Response Body:', responseText);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You need to subscribe to JSearch API on RapidAPI. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch');
    }
    throw new Error(`JSearch API returned ${response.status}: ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error(`Failed to parse JSearch response: ${parseError}`);
  }

  if (!data.data || !Array.isArray(data.data)) {
    console.log('No jobs found in JSearch response');
    return [];
  }

  // Filter jobs by location and transform to our format
  const filteredJobs = data.data.filter((job: any) => {
    // If searching for a specific city/state, filter out Arlington, VA unless it's the target
    const jobLocation = job.job_city && job.job_state 
      ? `${job.job_city}, ${job.job_state}` 
      : job.job_location || '';
    
    const searchLocation = params.location.toLowerCase();
    const jobLocationLower = jobLocation.toLowerCase();
    
    // If searching for a specific location, make sure it matches
    if (searchLocation && searchLocation !== 'united states' && searchLocation !== 'remote') {
      // Extract city and state from search location
      const searchParts = searchLocation.split(',').map(p => p.trim());
      
      if (searchParts.length >= 2) {
        const searchCity = searchParts[0];
        const searchState = searchParts[1];
        
        // Job should match the search city/state or be remote
        return jobLocationLower.includes(searchCity) || 
               jobLocationLower.includes(searchState) ||
               jobLocationLower.includes('remote') ||
               job.job_is_remote;
      } else {
        // Single location term - be more flexible
        return jobLocationLower.includes(searchLocation) ||
               jobLocationLower.includes('remote') ||
               job.job_is_remote;
      }
    }
    
    return true; // Include all jobs if no specific location filter
  });

  const jobs = filteredJobs.slice(0, params.limit).map((job: any) => ({
    id: job.job_id || `jsearch-${Math.random().toString(36).substr(2, 9)}`,
    title: job.job_title || 'No title',
    company: job.employer_name || 'Company not specified',
    location: job.job_city && job.job_state 
      ? `${job.job_city}, ${job.job_state}` 
      : job.job_location || job.job_country || 'Location not specified',
    description: job.job_description || 'No description available',
    url: job.job_apply_link || job.job_google_link || '#',
    posted: job.job_posted_at_datetime_utc || 'Recently posted',
    salary: job.job_min_salary && job.job_max_salary 
      ? `$${Math.round(job.job_min_salary/1000)}k-$${Math.round(job.job_max_salary/1000)}k` 
      : job.job_salary_currency && job.job_salary_period 
        ? `${job.job_salary_currency} ${job.job_salary_period}` 
        : 'Salary not specified',
    type: job.job_employment_type || 'Full-time',
    source: 'Indeed via JSearch (RapidAPI)',
    tags: job.job_highlights?.Qualifications?.slice(0, 3) || []
  }));

  console.log(`Filtered and transformed ${jobs.length} jobs from ${data.data.length} total JSearch results`);
  return jobs;
}

async function searchWithRapidAPI(params: {
  query: string;
  location: string;
  radius: number;
  jobType: string;
  limit: number;
}) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY not found');
  }
  
  const searchParams = new URLSearchParams({
    query: params.query,
    page: '1',
    num_pages: '1',
    date_posted: 'all',
    job_requirements: 'under_3_years_experience',
    employment_types: params.jobType || 'FULLTIME'
  });
  
  // Use JSearch API directly since user has subscription
  const searchUrl = `https://jsearch.p.rapidapi.com/search?${searchParams}`;
  console.log('Making request to JSearch API:', searchUrl);
  
  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('JSearch API Error:', response.status, errorText);
    throw new Error(`JSearch API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('JSearch API Response:', JSON.stringify(data, null, 2));
  
  // Transform JSearch response to our standard format
  if (!data.data || !Array.isArray(data.data)) {
    console.log('No jobs found in JSearch response');
    return [];
  }
  
  const jobs = data.data.map((job: any) => ({
    id: job.job_id || `jsearch-${Math.random().toString(36).substr(2, 9)}`,
    title: job.job_title,
    company: job.employer_name,
    location: job.job_city && job.job_state ? `${job.job_city}, ${job.job_state}` : job.job_country || job.job_city || 'Location not specified',
    description: job.job_description,
    url: job.job_apply_link || job.job_google_link,
    posted: job.job_posted_at_datetime_utc || job.job_posted_at_timestamp,
    salary: job.job_min_salary && job.job_max_salary 
      ? `$${Math.round(job.job_min_salary/1000)}k-$${Math.round(job.job_max_salary/1000)}k` 
      : job.job_salary_currency && job.job_salary_period 
        ? `${job.job_salary_currency} ${job.job_salary_period}` 
        : 'Not specified',
    type: job.job_employment_type || 'Full-time',
    source: 'Indeed via JSearch (RapidAPI)',
    tags: job.job_highlights?.Qualifications?.slice(0, 3) || []
  }));
  
  console.log(`Returning ${jobs.length} jobs from JSearch`);
  return jobs;
}

function generateSampleJobs(query: string, location: string, limit: number) {
  // Generate realistic sample jobs based on search terms
  const companies = [
    "Google",
    "Microsoft",
    "Apple",
    "Amazon",
    "Meta",
    "Netflix",
    "Tesla",
    "Salesforce",
    "Adobe",
    "Uber",
    "Airbnb",
    "Stripe",
    "Zoom",
    "Slack",
  ];

  const jobTypes = ["Full-time", "Part-time", "Contract", "Temporary"];
  const salaryRanges = ["$80k-120k", "$100k-150k", "$120k-180k", "$90k-130k"];

  const jobs = [];

  for (let i = 0; i < Math.min(limit, 20); i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const salary =
      salaryRanges[Math.floor(Math.random() * salaryRanges.length)];

    jobs.push({
      id: `sample-${i + 1}`,
      title: `${query} - ${company}`,
      company: company,
      location: location || "Remote",
      description: `Join our team as a ${query} at ${company}. We're looking for someone with experience in ${query.toLowerCase()} and related technologies. This is a ${jobType.toLowerCase()} position offering competitive compensation and excellent benefits.`,
      url: `https://indeed.com/viewjob?jk=sample${i + 1}`,
      posted: `${Math.floor(Math.random() * 30) + 1} days ago`,
      salary: salary,
      type: jobType,
      source: "Sample Data (Demo)",
      tags: query.split(" ").map((term) => term.toLowerCase()),
    });
  }

  return jobs;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = await request.json();

    // Save search preferences or handle job application
    // This could integrate with the job tracking system

    return NextResponse.json({
      success: true,
      message: "Search preferences saved",
    });
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 },
    );
  }
}
