"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Briefcase, Building, User } from "lucide-react";

interface InterviewSetupProps {
  onStart: (setupData: {
    jobDescription?: string;
    companyName?: string;
    roleTitle?: string;
    interviewType?: string;
  }) => void;
}

export default function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [setupData, setSetupData] = useState({
    companyName: "",
    roleTitle: "",
    interviewType: "",
    jobDescription: ""
  });

  const handleStart = () => {
    onStart(setupData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Interview Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="companyName"
                placeholder="e.g., Google, Microsoft, Startup Inc."
                value={setupData.companyName}
                onChange={(e) => setSetupData(prev => ({ ...prev, companyName: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleTitle">Role Title</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="roleTitle"
                placeholder="e.g., Software Engineer, Product Manager"
                value={setupData.roleTitle}
                onChange={(e) => setSetupData(prev => ({ ...prev, roleTitle: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interviewType">Interview Type</Label>
            <Select
              value={setupData.interviewType}
              onValueChange={(value) => setSetupData(prev => ({ ...prev, interviewType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Interview</SelectItem>
                <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                <SelectItem value="system-design">System Design</SelectItem>
                <SelectItem value="cultural-fit">Cultural Fit</SelectItem>
                <SelectItem value="case-study">Case Study</SelectItem>
                <SelectItem value="general">General Interview</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description (Optional)</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here to get more tailored interview questions..."
              value={setupData.jobDescription}
              onChange={(e) => setSetupData(prev => ({ ...prev, jobDescription: e.target.value }))}
              rows={6}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleStart}
            className="w-full"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Interview
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">AI Interviewer</h4>
                <p className="text-sm text-gray-600">
                  Our AI will conduct a realistic interview based on your job details. It asks relevant questions and responds naturally.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Real-time Transcription</h4>
                <p className="text-sm text-gray-600">
                  Everything spoken is transcribed in real-time so you can focus on the conversation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">AI Assistant</h4>
                <p className="text-sm text-gray-600">
                  Get live suggestions for better answers without the interviewer knowing. The assistant analyzes questions and provides guidance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Practice & Improve</h4>
                <p className="text-sm text-gray-600">
                  Review your performance and get insights to improve for real interviews.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Tips for Best Results</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use a quiet environment with good microphone</li>
              <li>• Speak clearly and at normal pace</li>
              <li>• Fill in job details for more relevant questions</li>
              <li>• Treat it like a real interview for best practice</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}