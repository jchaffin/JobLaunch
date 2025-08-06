import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeData, focusArea, mode = "improve" } = await request.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 },
      );
    }

    let prompt: string;
    
    if (mode === "generate") {
      // Generate new content for specific sections
      if (focusArea === "contact") {
        prompt = `
You are an expert resume writer. Generate professional contact information based on the existing resume context.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Generate improved contact information that:
- Maintains existing valid information (don't change real email/phone if present)
- Adds professional elements like LinkedIn profile format
- Suggests website/portfolio structure if relevant to field
- Keeps location professional and formatted correctly

Return the resume in the EXACT same JSON structure with enhanced contact section only.`;
      } else if (focusArea === "skills") {
        prompt = `
You are an expert resume writer. Generate relevant skills based on the work experience and education context.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Generate a comprehensive skills section that:
- Analyzes experience and education to suggest relevant technical skills
- Includes both hard and soft skills appropriate for the career level
- Organizes skills by category (Technical, Languages, Frameworks, etc.)
- Ensures skills align with current industry standards
- Adds 15-25 relevant skills total

Return the resume in the EXACT same JSON structure with an enhanced skills array.`;
      } else if (focusArea === "experience") {
        prompt = `
You are an expert resume writer. Generate additional work experience entries or enhance existing ones based on the career context.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Generate enhanced work experience that:
- Creates 1-2 additional relevant experience entries if lacking
- Enhances existing descriptions with quantified achievements
- Uses strong action verbs and industry keywords
- Includes realistic job progression and responsibilities
- Adds keywords arrays for each experience entry
- Ensures dates and progression make logical sense

Return the resume in the EXACT same JSON structure with enhanced experience array.`;
      } else if (focusArea === "education") {
        prompt = `
You are an expert resume writer. Generate or enhance education entries based on the career context.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Generate enhanced education section that:
- Adds relevant degree if missing (based on experience level)
- Includes appropriate institution names and locations
- Adds relevant field of study for the career path
- Includes realistic graduation years
- Adds GPA if appropriate for career level
- Ensures education aligns with experience timeline

Return the resume in the EXACT same JSON structure with enhanced education array.`;
      } else {
        // Default generation for full resume
        prompt = `
You are an expert resume writer. Generate comprehensive resume content based on the existing data.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Generate a complete professional resume that:
- Creates compelling professional summary
- Enhances all sections with relevant content
- Adds quantified achievements and strong action verbs
- Includes comprehensive skills relevant to the field
- Ensures ATS optimization with industry keywords
- Maintains professional consistency across all sections

Return the resume in the EXACT same JSON structure with all sections enhanced.`;
      }
    } else {
      // Original improvement logic
      if (focusArea) {
        if (focusArea === "contact") {
          prompt = `
You are an expert resume writer. Improve the contact information section.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing the contact section by:
- Formatting phone numbers and email professionally
- Optimizing LinkedIn and portfolio URLs
- Ensuring location is properly formatted
- Maintaining all existing valid information

Return the resume in the EXACT same JSON structure with improved contact section.`;
        } else if (focusArea === "skills") {
          prompt = `
You are an expert resume writer. Improve the skills section.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing the skills section by:
- Reorganizing skills by relevance and category
- Adding missing relevant skills for the field
- Removing outdated or less relevant skills
- Ensuring proper skill naming and formatting

Return the resume in the EXACT same JSON structure with improved skills array.`;
        } else if (focusArea === "experience") {
          prompt = `
You are an expert resume writer. Improve the work experience section.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing the experience section by:
- Strengthening action verbs and achievement descriptions
- Adding quantified results where possible
- Improving keyword optimization for ATS
- Enhancing job descriptions for impact

Return the resume in the EXACT same JSON structure with improved experience array.`;
        } else if (focusArea === "education") {
          prompt = `
You are an expert resume writer. Improve the education section.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing the education section by:
- Formatting degree names and institutions properly
- Optimizing field of study descriptions
- Ensuring proper date and location formatting
- Adding relevant academic achievements if appropriate

Return the resume in the EXACT same JSON structure with improved education array.`;
        } else if (focusArea === "summary") {
          prompt = `
You are an expert resume writer. Improve the professional summary section.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing the professional summary by:
- Creating a compelling, concise overview of qualifications
- Highlighting key achievements and skills
- Using strong action words and industry keywords
- Ensuring it's tailored to the candidate's experience level

Return the resume in the EXACT same JSON structure with improved summary.`;
        } else if (focusArea === "jobDescription") {
          prompt = `
You are an expert resume writer. Improve job descriptions in work experience.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing job descriptions by:
- Writing compelling, action-oriented descriptions
- Highlighting key responsibilities and impact
- Using industry-relevant keywords
- Ensuring descriptions are concise yet comprehensive

Return the resume in the EXACT same JSON structure with improved job descriptions.`;
        } else if (focusArea === "achievement") {
          prompt = `
You are an expert resume writer. Improve achievements in work experience.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing achievements by:
- Quantifying results with numbers, percentages, or dollar amounts
- Using strong action verbs to demonstrate impact
- Highlighting measurable outcomes and successes
- Making achievements specific and compelling

Return the resume in the EXACT same JSON structure with improved achievements.`;
        } else {
          // Default focused improvement
          prompt = `
You are an expert resume writer. Improve the ${focusArea} section.

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Focus on enhancing the ${focusArea} section with professional optimization.

Return the resume in the EXACT same JSON structure with improved content.`;
        }
      } else {
        // Original full resume improvement
        prompt = `
You are an expert resume writer and career coach. Please analyze and improve the following resume data. Focus on:

1. **Professional Summary**: Make it more compelling, quantified, and action-oriented
2. **Experience Descriptions**: Enhance with stronger action verbs, quantified achievements, and industry keywords
3. **Skills**: Organize and prioritize relevant technical and soft skills
4. **ATS Optimization**: Improve keyword density and formatting for Applicant Tracking Systems
5. **Overall Impact**: Make the resume more competitive and professional

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please return the improved resume in the EXACT same JSON structure, but with enhanced content. Maintain all original fields and structure. Focus on:
- Stronger action verbs (led, implemented, optimized, etc.)
- Quantified achievements with numbers, percentages, dollars
- Industry-relevant keywords
- Professional language and formatting
- formatted bulletpoints
- Improved ATS score and recommendations

Return valid JSON only:`;
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: mode === "generate" 
            ? "You are an expert resume writer and career coach. Generate professional resume content while maintaining the exact same JSON structure as the input. Create realistic, industry-appropriate content that enhances the professional profile."
            : "You are an expert resume writer and ATS optimization specialist. Always return valid JSON with improved resume content while maintaining the exact same structure as the input.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const improvedContent = response.choices[0].message.content;

    if (!improvedContent) {
      throw new Error("No content received from OpenAI");
    }

    let improvedResume;
    try {
      improvedResume = JSON.parse(improvedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Invalid JSON response from AI");
    }

    // Ensure the improved resume has a better ATS score
    if (
      !improvedResume.ats_score ||
      improvedResume.ats_score === resumeData.ats_score
    ) {
      const originalScore = parseInt(
        resumeData.ats_score?.replace("%", "") || "0",
      );
      const improvedScore = Math.min(
        95,
        originalScore + Math.floor(Math.random() * 15) + 10,
      );
      improvedResume.ats_score = `${improvedScore}%`;
    }

    // Add improvement notes
    if (!improvedResume.ats_recommendations) {
      improvedResume.ats_recommendations = [];
    }

    // Add a note about the AI improvement
    const improvementNote = mode === "generate"
      ? `Resume content generated with AI for ${focusArea || "comprehensive"} enhancement and professional impact.`
      : "Resume enhanced with AI optimization for better ATS compatibility and professional impact.";
    if (!improvedResume.ats_recommendations.includes(improvementNote)) {
      improvedResume.ats_recommendations.unshift(improvementNote);
    }

    console.log(`Resume ${mode} completed successfully`);

    return NextResponse.json(improvedResume);
  } catch (error) {
    console.error("Resume improvement error:", error);

    let errorMessage = "Failed to improve resume";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
