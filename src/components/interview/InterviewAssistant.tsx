"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Lightbulb, Brain, Target, Clock } from "lucide-react";

interface InterviewAssistantProps {
  session: {
    id: string;
    status: string;
    jobDescription?: string;
    companyName?: string;
    roleTitle?: string;
    interviewType?: string;
  };
  isRecording: boolean;
  transcription: Array<{
    speaker: 'interviewer' | 'candidate';
    text: string;
    timestamp: Date;
  }>;
  onSuggestion: (suggestion: {
    text: string;
    confidence: number;
    keyPoints: string[];
  }) => void;
  onTranscription: (text: string) => void;
}

export default function InterviewAssistant({ 
  session, 
  isRecording, 
  transcription, 
  onSuggestion, 
  onTranscription 
}: InterviewAssistantProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'listening' | 'analyzing' | 'suggesting'>('idle');
  const [currentAnalysis, setCurrentAnalysis] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastQuestionRef = useRef<string>("");

  useEffect(() => {
    if (isRecording && session.status === 'active') {
      initializeAssistant();
    } else {
      disconnectAssistant();
    }

    return () => {
      disconnectAssistant();
    };
  }, [isRecording, session.status]);

  // Analyze new transcription for interviewer questions
  useEffect(() => {
    const lastMessage = transcription[transcription.length - 1];
    if (lastMessage && lastMessage.speaker === 'interviewer' && lastMessage.text !== lastQuestionRef.current) {
      lastQuestionRef.current = lastMessage.text;
      analyzeQuestion(lastMessage.text);
    }
  }, [transcription]);

  const initializeAssistant = async () => {
    try {
      // Initialize WebSocket connection for the assistant
      const response = await fetch('/api/interview/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id + '_assistant',
          role: 'assistant',
          context: {
            companyName: session.companyName,
            roleTitle: session.roleTitle,
            interviewType: session.interviewType,
            jobDescription: session.jobDescription,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize assistant session');
      }

      const data = await response.json();
      
      // Connect to WebSocket
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/interview/websocket?sessionId=${data.sessionId}&role=assistant`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setAssistantStatus('listening');
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleAssistantMessage(message);
      };

      wsRef.current.onerror = (error) => {
        console.error('Assistant WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setAssistantStatus('idle');
      };

      // Initialize audio capture for candidate responses
      await initializeAudio();

    } catch (error) {
      console.error('Failed to initialize interview assistant:', error);
    }
  };

  const initializeAudio = async () => {
    try {
      audioContextRef.current = new AudioContext();
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Create audio processing pipeline
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && assistantStatus === 'listening') {
          const audioData = event.inputBuffer.getChannelData(0);
          const audioArray = new Float32Array(audioData);
          
          // Convert to base64 and send to WebSocket
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioArray.buffer)));
          wsRef.current.send(JSON.stringify({
            type: 'audio_chunk',
            data: base64Audio,
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error('Failed to initialize audio for assistant:', error);
    }
  };

  const analyzeQuestion = async (question: string) => {
    setAssistantStatus('analyzing');
    setCurrentAnalysis(question);

    try {
      // Send question to assistant for analysis
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'analyze_question',
          question: question,
          context: {
            conversationHistory: transcription.slice(-5), // Last 5 exchanges
            jobDescription: session.jobDescription,
            roleTitle: session.roleTitle,
            interviewType: session.interviewType,
          }
        }));
      }
    } catch (error) {
      console.error('Failed to analyze question:', error);
      setAssistantStatus('listening');
    }
  };

  const handleAssistantMessage = (message: any) => {
    switch (message.type) {
      case 'transcription':
        // Candidate speaking - transcribe but don't interfere
        if (message.speaker === 'candidate') {
          onTranscription(message.text);
        }
        break;

      case 'suggestion':
        setAssistantStatus('suggesting');
        setConfidenceLevel(message.confidence || 0.8);
        
        onSuggestion({
          text: message.suggestion,
          confidence: message.confidence || 0.8,
          keyPoints: message.keyPoints || []
        });
        
        // Return to listening after suggestion
        setTimeout(() => {
          setAssistantStatus('listening');
        }, 1500);
        break;

      case 'analysis_complete':
        setCurrentAnalysis(message.summary || "");
        setAssistantStatus('listening');
        break;

      case 'status_update':
        setAssistantStatus(message.status);
        break;

      default:
        console.log('Unknown message type from assistant:', message.type);
    }
  };

  const disconnectAssistant = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setIsConnected(false);
    setAssistantStatus('idle');
  };

  return (
    <div className="space-y-4">
      {/* Assistant Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <Badge 
          variant={isConnected ? 'default' : 'secondary'}
          className={isConnected ? 'bg-yellow-600' : ''}
        >
          {isConnected ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Current Status */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${
            assistantStatus === 'analyzing' ? 'bg-blue-500 animate-pulse' :
            assistantStatus === 'suggesting' ? 'bg-yellow-500 animate-pulse' :
            assistantStatus === 'listening' ? 'bg-green-500 animate-pulse' :
            'bg-gray-400'
          }`} />
          <span className="text-sm font-medium capitalize">
            {assistantStatus === 'analyzing' ? 'Analyzing Question' :
             assistantStatus === 'suggesting' ? 'Generating Suggestion' :
             assistantStatus === 'listening' ? 'Listening' :
             'Standby'}
          </span>
        </div>
        
        {currentAnalysis && (
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Analyzing:</p>
            <p className="italic">"{currentAnalysis.substring(0, 100)}..."</p>
          </div>
        )}

        {confidenceLevel > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Confidence Level</span>
              <span>{Math.round(confidenceLevel * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${confidenceLevel * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Assistant Capabilities */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Assistant Features</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Brain className="w-4 h-4 text-blue-500" />
            <div className="text-sm">
              <div className="font-medium">Smart Analysis</div>
              <div className="text-gray-600">Analyzes questions for key themes</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Target className="w-4 h-4 text-green-500" />
            <div className="text-sm">
              <div className="font-medium">Targeted Suggestions</div>
              <div className="text-gray-600">Provides relevant answer frameworks</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-purple-500" />
            <div className="text-sm">
              <div className="font-medium">Real-time Support</div>
              <div className="text-gray-600">Instant help during conversation</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Button
          onClick={() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'request_general_tips',
                interviewType: session.interviewType
              }));
            }
          }}
          disabled={!isConnected}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Get General Tips
        </Button>
        
        <Button
          onClick={() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'request_question_examples',
                roleTitle: session.roleTitle,
                interviewType: session.interviewType
              }));
            }
          }}
          disabled={!isConnected}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Common Questions
        </Button>
      </div>

      {/* Performance Metrics */}
      <Card className="p-4">
        <h4 className="font-medium mb-2">Session Stats</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Questions</div>
            <div className="font-bold">{transcription.filter(t => t.speaker === 'interviewer').length}</div>
          </div>
          <div>
            <div className="text-gray-600">Responses</div>
            <div className="font-bold">{transcription.filter(t => t.speaker === 'candidate').length}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}