'use client'

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface ParsedResumeData {
  summary?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    role: string;
    duration?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrentRole?: boolean;
    location?: string;
    description?: string;
    achievements?: string[];
    responsibilities?: string[];
    keywords?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    year: string;
    gpa?: string;
    honors?: string;
  }>;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  ats_score?: string;
  ats_recommendations?: string[];
  tailoring_notes?: {
    keyChanges?: string[];
    keywordsAdded?: string[];
    focusAreas?: string[];
  };
}

interface StructuredResumePreviewProps {
  resumeData: ParsedResumeData | null;
  title?: string;
  className?: string;
}

export function StructuredResumePreview({ resumeData, title = "Resume Preview", className }: StructuredResumePreviewProps) {
  if (!resumeData) {
    return (
      <div className="text-center text-gray-500">
        No resume data available for preview
      </div>
    );
  }

  return (
    <div className={`space-y-6 pr-4 ${className}`}>
      {/* Summary */}
      {resumeData.summary && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Professional Summary
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {resumeData.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Experience
          </h4>
          <div className="space-y-4">
            {resumeData.experience.map((exp, index) => (
              <div
                key={index}
                className="border-l-2 border-blue-200 pl-4 w-full"
              >
                <div className="w-full">
                  <div className="w-full">
                    <h5 className="font-medium text-gray-900 break-words">
                      {exp.role}
                    </h5>
                    <p className="text-sm text-blue-600 break-words">
                      {exp.company}
                    </p>
                    <p className="text-xs text-gray-500 break-words">
                      {exp.duration}
                    </p>
                  </div>
                </div>
                {/* Show achievements */}
                {exp.achievements && exp.achievements.length > 0 && (
                  <div className="text-sm text-gray-700 mt-2 w-full">
                    <p className="font-medium text-gray-800 mb-2">Key Achievements:</p>
                    <div className="space-y-2">
                      {exp.achievements.map((achievement, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="mr-2 mt-1 text-gray-600">•</span>
                          <div className="flex-1 break-words leading-relaxed whitespace-pre-line">{achievement}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show responsibilities */}
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <div className="text-sm text-gray-700 mt-2 w-full">
                    <p className="font-medium text-gray-800 mb-2">Responsibilities:</p>
                    <div className="space-y-2">
                      {exp.responsibilities.map((responsibility, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="mr-2 mt-1 text-gray-600">•</span>
                          <div className="flex-1 break-words leading-relaxed whitespace-pre-line">{responsibility}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fallback for description field */}
                {exp.description && (
                  <div className="text-sm text-gray-700 mt-2 w-full">
                    <p className="font-medium text-gray-800 mb-1">Description:</p>
                    <p className="break-words leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Education
          </h4>
          <div className="space-y-3">
            {resumeData.education.map((edu, index) => (
              <div
                key={index}
                className="border-l-2 border-purple-200 pl-4"
              >
                <h5 className="font-medium text-gray-900">
                  {edu.degree}
                </h5>
                <p className="text-sm text-purple-600">
                  {edu.institution}
                </p>
                <p className="text-xs text-gray-500">
                  {edu.year}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATS Score and Recommendations */}
      {(resumeData.ats_score || (resumeData.ats_recommendations && resumeData.ats_recommendations.length > 0)) && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ATS Analysis & Recommendations
          </h4>
          
          {resumeData.ats_score && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">ATS Compatibility Score</span>
                <span className="text-lg font-bold text-green-600">{resumeData.ats_score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${parseInt((resumeData.ats_score || '0').toString().replace('%', '')) || 0}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {resumeData.ats_recommendations && resumeData.ats_recommendations.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-800 mb-2">AI Recommendations:</h5>
              <div className="space-y-2">
                {resumeData.ats_recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tailoring Notes */}
      {resumeData.tailoring_notes && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            Tailoring Summary
          </h4>
          <div className="space-y-3">
            {resumeData.tailoring_notes.keyChanges && resumeData.tailoring_notes.keyChanges.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Key Changes Made:</h5>
                <div className="space-y-2">
                  {resumeData.tailoring_notes.keyChanges.map((change, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 leading-relaxed">{change}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {resumeData.tailoring_notes.keywordsAdded && resumeData.tailoring_notes.keywordsAdded.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Keywords Added:</h5>
                <div className="flex flex-wrap gap-2">
                  {resumeData.tailoring_notes.keywordsAdded.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {resumeData.tailoring_notes.focusAreas && resumeData.tailoring_notes.focusAreas.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Focus Areas:</h5>
                <div className="space-y-2">
                  {resumeData.tailoring_notes.focusAreas.map((area, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 leading-relaxed">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}