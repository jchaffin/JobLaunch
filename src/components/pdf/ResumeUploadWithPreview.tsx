"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import ResumeUpload from "@/components/pdf/ResumeUpload";
import PDFPreviewPane from "@/components/pdf/PDFPreviewPane";

type ParsedResume = {
  // mirror what your ResumeUpload emits
  summary: string;
  skills: string[];
  jobTitle?: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    startDate?: Date;
    endDate?: Date;
    isCurrentRole?: boolean;
    location?: string;
    description?: string;
    achievements: string[];
    responsibilities: string[];
    keywords: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    year: string;
    graduationDate?: Date;
    location?: string;
    gpa?: string;
    honors?: string;
  }>;
  contact: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    address?: string;
    country?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  ats_score: string;
  ats_recommendations: string[];
  tailoring_notes?: {
    keyChanges?: string[];
    keywordsAdded?: string[];
    focusAreas?: string[];
  };
};

interface ResumeUploadWithPreviewProps {
  onResumeUploaded: (resume: ParsedResume) => void;
  currentResume: ParsedResume | null;
  autoParseExisting?: boolean;
  onNavigateToJobs: () => void;
}

export default function ResumeUploadWithPreview({
  onResumeUploaded,
  currentResume,
  autoParseExisting = false,
  onNavigateToJobs,
}: ResumeUploadWithPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);



  return (
    <div className="flex h-full">
      {/* Resume Upload Form - Full width when preview collapsed, half when expanded */}
      <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto bg-gray-50 p-6 transition-all duration-300`}>
        <ResumeUpload
          onResumeUploaded={onResumeUploaded}
          currentResume={currentResume}
          autoParseExisting={autoParseExisting}
        />

        {/* Quick Actions Card */}
        {currentResume && (
          <Card className="bg-blue-50 border-blue-200 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-900 text-lg">
                    Resume Ready
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Your resume has been processed successfully
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  Processed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={onNavigateToJobs}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Add Job to Match
                </Button>
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Add a job description to create tailored resumes and get
                detailed match analysis. {showPreview ? 'The preview panel shows your uploaded PDF in real-time.' : 'Click "Show Preview" to see your PDF.'}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Floating Preview Toggle for when no resume */}
        {!currentResume && (
          <div className="fixed bottom-6 right-6 z-10">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="bg-white shadow-lg border-gray-200 hover:bg-gray-50"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* PDF Preview Panel - Only show when expanded */}
      {showPreview && (
        <div className="w-1/2 bg-white border-l border-gray-200 transition-all duration-300">
          {currentResume && (currentResume.summary || currentResume.contact?.firstName || currentResume.contact?.name || (currentResume.experience && currentResume.experience.length > 0)) ? (
            <Card className="h-full rounded-none border-none">

              <CardContent className="p-0 flex-1">
                <div className="h-full overflow-hidden">
                  <PDFPreviewPane resumeData={currentResume} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">PDF Preview</p>
                <p className="text-sm">Resume data loaded - generating preview...</p>
                <p className="text-xs text-gray-400 mt-2">
                  {currentResume ? "Processing resume data" : "Upload a resume to see the preview"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
