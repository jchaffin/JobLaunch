"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, User, Bot, Lightbulb, Settings } from "lucide-react";
import InterviewAgent from "@/components/interview/InterviewAgent"
import InterviewAssistant from "@/components/interview/InterviewAssistant"
import InterviewSetup from "@/components/interview/InterviewSetup"


interface InterviewSession {
  id: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  startTime?: Date;
  endTime?: Date;
  jobDescription?: string;
  companyName?: string;
  roleTitle?: string;
  interviewType?: string;
}

export default function LiveInterviewPage() {
  const [session, setSession] = useState<InterviewSession>({
    id: '',
    status: 'setup'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<Array<{
    speaker: 'interviewer' | 'candidate';
    text: string;
    timestamp: Date;
  }>>([]);
  const [suggestions, setSuggestions] = useState<Array<{
    text: string;
    confidence: number;
    keyPoints: string[];
  }>>([]);

  const startInterview = (setupData: {
    jobDescription?: string;
    companyName?: string;
    roleTitle?: string;
    interviewType?: string;
  }) => {
    const newSession: InterviewSession = {
      id: Date.now().toString(),
      status: 'active',
      startTime: new Date(),
      ...setupData
    };
    setSession(newSession);
  };

  const endInterview = () => {
    setSession(prev => ({
      ...prev,
      status: 'completed',
      endTime: new Date()
    }));
    setIsRecording(false);
  };

  const handleNewTranscription = (speaker: 'interviewer' | 'candidate', text: string) => {
    setTranscription(prev => [...prev, {
      speaker,
      text,
      timestamp: new Date()
    }]);
  };

  const handleNewSuggestion = (suggestion: {
    text: string;
    confidence: number;
    keyPoints: string[];
  }) => {
    setSuggestions(prev => [suggestion, ...prev.slice(0, 4)]); // Keep last 5 suggestions
  };

  if (session.status === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Live Interview Assistant</h1>
            <p className="text-gray-600 mt-2">
              Practice with our AI interviewer and get real-time suggestions
            </p>
          </div>
          
          <InterviewSetup onStart={startInterview} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Interview</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
                {session.companyName && (
                  <span className="text-sm text-gray-600">
                    {session.companyName} - {session.roleTitle}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsRecording(!isRecording)}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="flex items-center space-x-2"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={endInterview}
                variant="outline"
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>

        {/* Main Interview Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interview Agent (Left Column) */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span>AI Interviewer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InterviewAgent
                  session={session}
                  isRecording={isRecording}
                  onTranscription={(text) => handleNewTranscription('interviewer', text)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Transcription (Middle Column) */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-green-600" />
                  <span>Conversation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <div className="h-full overflow-y-auto space-y-4">
                  {transcription.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Conversation will appear here when you start recording</p>
                    </div>
                  ) : (
                    transcription.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          item.speaker === 'interviewer'
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'bg-green-50 border-l-4 border-green-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {item.speaker === 'interviewer' ? 'Interviewer' : 'You'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Assistant (Right Column) */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <span>AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <InterviewAssistant
                  session={session}
                  isRecording={isRecording}
                  transcription={transcription}
                  onSuggestion={handleNewSuggestion}
                  onTranscription={(text) => handleNewTranscription('candidate', text)}
                />
                
                {/* Suggestions Display */}
                <div className="mt-4 space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-yellow-800">
                          Suggestion {index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{suggestion.text}</p>
                      {suggestion.keyPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.keyPoints.map((point, pointIndex) => (
                            <Badge key={pointIndex} variant="secondary" className="text-xs">
                              {point}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}