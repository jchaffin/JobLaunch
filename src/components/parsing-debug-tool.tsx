'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bug, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParsingDebugToolProps {
  originalText: string;
  parsedData: any;
}

export function ParsingDebugTool({ originalText, parsedData }: ParsingDebugToolProps) {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const { toast } = useToast();

  const runDebugParsing = async () => {
    setIsDebugging(true);
    try {
      const response = await fetch('/api/resume/debug-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: originalText })
      });

      if (response.ok) {
        const result = await response.json();
        setDebugResult(result);
        toast({
          title: "Debug Analysis Complete",
          description: "Check the results below for parsing insights",
        });
      } else {
        throw new Error('Debug analysis failed');
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Failed",
        description: "Could not analyze parsing",
        variant: "destructive"
      });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Parsing Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDebugParsing} 
            disabled={isDebugging}
            variant="outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isDebugging ? 'Analyzing...' : 'Analyze Parsing'}
          </Button>
        </div>

        {debugResult && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Work Experience Section Found:</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                {debugResult.debugExtraction?.workExperienceSection || 'No work experience section detected'}
              </div>
            </div>

            {debugResult.debugExtraction?.identifiedJobs && (
              <div>
                <h4 className="font-semibold mb-2">Identified Jobs:</h4>
                <div className="space-y-3">
                  {debugResult.debugExtraction.identifiedJobs.map((job: any, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Company:</strong> {job.companyName}</div>
                        <div><strong>Title:</strong> {job.jobTitle}</div>
                        <div><strong>Dates:</strong> {job.dates}</div>
                        <div><strong>Location:</strong> {job.location}</div>
                      </div>
                      <div className="mt-2">
                        <strong>Raw Text:</strong>
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono mt-1">
                          {job.rawText}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugResult.standardParsing?.experience && (
              <div>
                <h4 className="font-semibold mb-2">Final Parsed Experience:</h4>
                <div className="space-y-2">
                  {debugResult.standardParsing.experience.map((exp: any, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{exp.role}</Badge>
                        <span className="text-sm text-gray-600">at {exp.company}</span>
                      </div>
                      <div className="text-sm">
                        <div><strong>Duration:</strong> {exp.duration}</div>
                        <div><strong>Location:</strong> {exp.location}</div>
                        <div><strong>Current Role:</strong> {exp.isCurrentRole ? 'Yes' : 'No'}</div>
                        {exp.achievements && exp.achievements.length > 0 && (
                          <div><strong>Achievements:</strong> {exp.achievements.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Parsing Notes:</h4>
              <p className="text-sm text-gray-600">
                {debugResult.debugExtraction?.parsingNotes || 'No additional notes'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Original Text Preview (first 1000 chars):</h4>
              <Textarea 
                value={debugResult.originalText} 
                readOnly 
                rows={6}
                className="text-xs font-mono"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}