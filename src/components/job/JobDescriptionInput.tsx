"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobDescriptionInputProps {
  onJobAnalyzed: (jobData: { description: string; analysis: any }) => void;
  initialDescription?: string;
}

export default function JobDescriptionInput({
  onJobAnalyzed,
  initialDescription = "",
}: JobDescriptionInputProps) {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState(initialDescription);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = Math.min(textarea.scrollHeight, 600); // max 600px
      const minHeight = Math.max(scrollHeight, 300); // min 300px
      textarea.style.height = `${minHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [jobDescription]);

  // Auto-fill with Apple job description if no initial description provided
  const appleJobDescription = `Full job description
Imagine what you could do here. At Apple, new ideas have a way of becoming great products, services, and customer experiences very quickly. Bring passion and dedication to your job and there's no telling what you could accomplish. The Audio & Music Apps group is looking for a software engineer. The Cupertino engineering team works on GarageBand, Logic Remote, Logic, MainStage, and Voice Memos.

Description

Our team practices fast-paced development that relies heavily on a tight relationship between engineering, QA and product design. This position requires a highly ambitious & creative engineer with strong technical and communication skills. Responsibilities will include working on new features for macOS and/or iOS applications, developing new audio and music related technologies and applications, and supporting the existing features of our apps. Attention to detail and critical thinking skills are essential.

Minimum Qualifications
At least 2 years of programming skills with Objective-C and/or Swift
Experience developing and shipping for iOS and macOS
Strong knowledge of Xcode and related developer tools
Bachelor's Degree in Computer Science, Engineering, or other related fields is required

Preferred Qualifications
Music, audio production skills, understanding musical concepts
Playing an instrument is a big plus

Pay & Benefits

At Apple, base pay is one part of our total compensation package and is determined within a range. This provides the opportunity to progress as you grow and develop within a role. The base pay range for this role is between $139,500 and $258,100, and your base pay will depend on your skills, qualifications, experience, and location.

Apple employees also have the opportunity to become an Apple shareholder through participation in Apple's discretionary employee stock programs. Apple employees are eligible for discretionary restricted stock unit awards, and can purchase Apple stock at a discount if voluntarily participating in Apple's Employee Stock Purchase Plan. You'll also receive benefits including: Comprehensive medical and dental coverage, retirement benefits, a range of discounted products and free services, and for many roles, the option to work remotely part of the time.

Note: Apple benefit, compensation and employee stock programs are subject to eligibility requirements and other terms of the applicable plan or program.

Apple is an equal opportunity employer that is committed to inclusion and diversity. We seek to promote equal opportunity for all applicants without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, disability, Veteran status, or other legally protected characteristics.`;

  const analyzeJobDescription = async () => {
    const currentDescription = jobDescription || appleJobDescription;

    if (!currentDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/job/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: currentDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job description");
      }

      const data = await response.json();

      onJobAnalyzed({
        description: currentDescription,
        analysis: data,
      });

      toast({
        title: "Job analyzed successfully",
        description: `Found ${data.company} ${data.role} position with ${data.requiredSkills?.length || 0} key requirements.`,
      });
    } catch (error) {
      console.error("Job analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the job description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadAppleExample = () => {
    setJobDescription(appleJobDescription);
    toast({
      title: "Apple job description loaded",
      description:
        "Software Engineer position at Apple has been loaded for analysis.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Job Description Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Paste Job Description
          </label>
          <Textarea
            ref={textareaRef}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              adjustTextareaHeight();
            }}
            className="min-h-[300px] max-h-[600px] resize-none overflow-y-auto"
            style={{ height: "300px" }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={analyzeJobDescription}
            disabled={isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Job Description
              </>
            )}
          </Button>

          {!jobDescription && (
            <Button
              onClick={loadAppleExample}
              variant="outline"
              className="flex-shrink-0"
            >
              Load Apple Example
            </Button>
          )}
        </div>

        {jobDescription && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Content Preview</span>
              <Badge variant="outline">
                {jobDescription.length} characters
              </Badge>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
              {jobDescription.slice(0, 200)}...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
