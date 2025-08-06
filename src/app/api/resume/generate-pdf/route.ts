import { NextRequest } from "next/server";
import jsPDF from "jspdf";

interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

interface Experience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrentRole?: boolean;
  location?: string;
  description?: string;
  achievements: string[];
  responsibilities: string[];
  keywords: string[];
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  year: string;
  gpa?: string;
  honors?: string;
}

interface ParsedResume {
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  contact: Contact;
  ats_score?: string;
  ats_recommendations?: string[];
  jobDescription?: string; // Add job description field
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { resumeData, jobDescription } = JSON.parse(body) as { 
      resumeData: ParsedResume | null; 
      jobDescription?: string;
    };
    
    if (!resumeData) {
      return new Response(
        JSON.stringify({ error: "No resume data provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create PDF using jsPDF
    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 6;
    const marginLeft = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 40;

    // Helper function to check if we need a new page
    const checkPageBreak = (nextLineCount: number = 1) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (yPosition + (nextLineCount * lineHeight) > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize = 11, isBold = false) => {
      if (isBold) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(fontSize);
      
      const splitText = doc.splitTextToSize(text, maxWidth);
      checkPageBreak(splitText.length);
      doc.text(splitText, marginLeft, yPosition);
      yPosition += splitText.length * lineHeight;
    };

    // Header
    if (resumeData.contact?.name) {
      addText(resumeData.contact.name, 18, true);
      yPosition += 2;
    }
    
    // Contact Information
    if (resumeData.contact?.email || resumeData.contact?.phone || resumeData.contact?.location) {
      const contactInfo = [
        resumeData.contact?.email, 
        resumeData.contact?.phone,
        resumeData.contact?.location
      ].filter(Boolean).join(" | ");
      addText(contactInfo, 10);
      yPosition += 3;
    }

    // LinkedIn and other links
    if (resumeData.contact?.linkedin || resumeData.contact?.github || resumeData.contact?.website) {
      const links = [
        resumeData.contact?.linkedin,
        resumeData.contact?.github,
        resumeData.contact?.website
      ].filter(Boolean).join(" | ");
      addText(links, 10);
      yPosition += 5;
    }

    // Job Description Section (if provided)
    if (jobDescription && jobDescription.trim()) {
      yPosition += 5;
      addText("TARGET JOB DESCRIPTION", 12, true);
      yPosition += 2;
      addText(jobDescription.trim(), 9);
      yPosition += 5;
      
      // Add a separator line
      doc.setLineWidth(0.5);
      doc.line(marginLeft, yPosition, pageWidth - marginLeft, yPosition);
      yPosition += 8;
    }

    // Summary
    if (resumeData.summary) {
      addText("PROFESSIONAL SUMMARY", 12, true);
      yPosition += 2;
      addText(resumeData.summary);
      yPosition += 5;
    }

    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      addText("TECHNICAL SKILLS", 12, true);
      yPosition += 2;
      addText(resumeData.skills.join(" • "));
      yPosition += 5;
    }

    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      addText("PROFESSIONAL EXPERIENCE", 12, true);
      yPosition += 2;
      
      resumeData.experience.forEach((exp, index) => {
        // Company and role
        addText(`${exp.role} at ${exp.company}`, 11, true);
        
        // Date range and location
        const dateRange = `${exp.startDate || "Start"} - ${exp.isCurrentRole ? "Present" : exp.endDate || "End"}`;
        const locationText = exp.location ? ` | ${exp.location}` : "";
        addText(`${dateRange}${locationText}`, 10);
        yPosition += 2;
        
        // Description
        if (exp.description) {
          addText(exp.description, 10);
          yPosition += 1;
        }
        
        // Achievements
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement) => {
            addText(`• ${achievement}`, 10);
          });
        }
        
        // Responsibilities (if different from achievements)
        if (exp.responsibilities && exp.responsibilities.length > 0 && 
            JSON.stringify(exp.responsibilities) !== JSON.stringify(exp.achievements)) {
          exp.responsibilities.forEach((responsibility) => {
            addText(`• ${responsibility}`, 10);
          });
        }
        
        if (index < resumeData.experience.length - 1) {
          yPosition += 3;
        }
      });
      yPosition += 5;
    }

    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      addText("EDUCATION", 12, true);
      yPosition += 2;
      
      resumeData.education.forEach((edu, index) => {
        const degreeText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`;
        addText(degreeText, 11, true);
        addText(edu.institution, 10);
        if (edu.year) {
          addText(`Graduated: ${edu.year}`, 10);
        }
        if (edu.gpa) {
          addText(`GPA: ${edu.gpa}`, 10);
        }
        if (edu.honors) {
          addText(`Honors: ${edu.honors}`, 10);
        }
        if (index < resumeData.education.length - 1) {
          yPosition += 3;
        }
      });
    }

    // ATS Information (if available)
    if (resumeData.ats_score || (resumeData.ats_recommendations && resumeData.ats_recommendations.length > 0)) {
      yPosition += 8;
      addText("ATS ANALYSIS", 12, true);
      yPosition += 2;
      
      if (resumeData.ats_score) {
        addText(`ATS Score: ${resumeData.ats_score}`, 10, true);
        yPosition += 1;
      }
      
      if (resumeData.ats_recommendations && resumeData.ats_recommendations.length > 0) {
        addText("Recommendations:", 10, true);
        resumeData.ats_recommendations.forEach((rec) => {
          addText(`• ${rec}`, 10);
        });
      }
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=resume.pdf",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}