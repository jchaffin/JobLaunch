'use client'

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptionItem {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'interviewer' | 'user';
}

interface TranscriptionPanelProps {
  transcriptions: TranscriptionItem[];
  onClear: () => void;
}

export function TranscriptionPanel({ transcriptions, onClear }: TranscriptionPanelProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    const transcriptText = transcriptions
      .map(t => `${t.speaker === 'interviewer' ? 'Interviewer' : 'You'}: ${t.text}`)
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(transcriptText);
      toast({
        title: "Copied to clipboard",
        description: "Transcription has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy transcription to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 60000) {
      return 'Just now';
    } else if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Live Transcription</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="p-1.5 text-gray-500 hover:text-gray-900"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="p-1.5 text-gray-500 hover:text-gray-900"
            disabled={transcriptions.length === 0}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4">
          {transcriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Start recording to see live transcription</p>
            </div>
          ) : (
            transcriptions.map((transcription, index) => (
              <div
                key={transcription.id}
                className={`rounded-xl p-4 ${
                  index === 0 && transcription.speaker === 'interviewer'
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    transcription.speaker === 'interviewer'
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                  }`}>
                    {transcription.speaker === 'interviewer' ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${
                      transcription.speaker === 'interviewer' ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {transcription.speaker === 'interviewer' ? 'Interviewer' : 'You'}
                    </p>
                    <p className="text-gray-900 leading-relaxed">{transcription.text}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatTimestamp(transcription.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}