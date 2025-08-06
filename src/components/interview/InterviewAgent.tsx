"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bot, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface InterviewAgentProps {
  session: {
    id: string;
    status: string;
    jobDescription?: string;
    companyName?: string;
    roleTitle?: string;
    interviewType?: string;
  };
  isRecording: boolean;
  onTranscription: (text: string) => void;
}

export default function InterviewAgent({ session, isRecording, onTranscription }: InterviewAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [agentStatus, setAgentStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'interviewer' | 'candidate';
    content: string;
  }>>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording && session.status === 'active') {
      initializeAgent();
    } else {
      disconnectAgent();
    }

    return () => {
      disconnectAgent();
    };
  }, [isRecording, session.status]);

  const initializeAgent = async () => {
    try {
      // Initialize WebSocket connection to OpenAI Realtime API
      const response = await fetch('/api/interview/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          role: 'interviewer',
          context: {
            companyName: session.companyName,
            roleTitle: session.roleTitle,
            interviewType: session.interviewType,
            jobDescription: session.jobDescription,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize interviewer session');
      }

      const data = await response.json();
      
      // Connect to WebSocket
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/interview/websocket?sessionId=${data.sessionId}&role=interviewer`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setAgentStatus('thinking');
        
        // Send initial interview context
        wsRef.current?.send(JSON.stringify({
          type: 'start_interview',
          context: {
            companyName: session.companyName,
            roleTitle: session.roleTitle,
            interviewType: session.interviewType,
            jobDescription: session.jobDescription,
          }
        }));
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleAgentMessage(message);
      };

      wsRef.current.onerror = (error) => {
        console.error('Interviewer WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setAgentStatus('idle');
      };

      // Initialize audio capture for the agent
      await initializeAudio();

    } catch (error) {
      console.error('Failed to initialize interviewer agent:', error);
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
        if (wsRef.current?.readyState === WebSocket.OPEN && agentStatus === 'listening') {
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
      console.error('Failed to initialize audio for interviewer:', error);
    }
  };

  const handleAgentMessage = (message: any) => {
    switch (message.type) {
      case 'transcription':
        if (message.speaker === 'candidate') {
          // Candidate spoke, agent should listen and respond
          setAgentStatus('thinking');
          setConversationHistory(prev => [...prev, {
            role: 'candidate',
            content: message.text
          }]);
        }
        break;

      case 'agent_question':
        setCurrentQuestion(message.question);
        setAgentStatus('speaking');
        onTranscription(message.question);
        setConversationHistory(prev => [...prev, {
          role: 'interviewer',
          content: message.question
        }]);
        
        // After speaking, start listening
        setTimeout(() => {
          setAgentStatus('listening');
        }, 2000);
        break;

      case 'agent_response':
        onTranscription(message.response);
        setConversationHistory(prev => [...prev, {
          role: 'interviewer',
          content: message.response
        }]);
        setAgentStatus('listening');
        break;

      case 'status_update':
        setAgentStatus(message.status);
        break;

      default:
        console.log('Unknown message type from interviewer:', message.type);
    }
  };

  const disconnectAgent = () => {
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
    setAgentStatus('idle');
  };

  return (
    <div className="space-y-4">
      {/* Agent Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <span className="font-medium">AI Interviewer</span>
        </div>
        <Badge 
          variant={isConnected ? 'default' : 'secondary'}
          className={isConnected ? 'bg-green-600' : ''}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Current Status */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${
            agentStatus === 'speaking' ? 'bg-blue-500 animate-pulse' :
            agentStatus === 'listening' ? 'bg-green-500 animate-pulse' :
            agentStatus === 'thinking' ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-400'
          }`} />
          <span className="text-sm font-medium capitalize">
            {agentStatus === 'speaking' ? 'Speaking' :
             agentStatus === 'listening' ? 'Listening' :
             agentStatus === 'thinking' ? 'Thinking' :
             'Idle'}
          </span>
        </div>
        
        {currentQuestion && (
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Current Question:</p>
            <p className="italic">"{currentQuestion}"</p>
          </div>
        )}
      </Card>

      {/* Interview Context */}
      <Card className="p-4">
        <h4 className="font-medium mb-2">Interview Context</h4>
        <div className="space-y-2 text-sm">
          {session.companyName && (
            <div>
              <span className="font-medium">Company:</span> {session.companyName}
            </div>
          )}
          {session.roleTitle && (
            <div>
              <span className="font-medium">Role:</span> {session.roleTitle}
            </div>
          )}
          {session.interviewType && (
            <div>
              <span className="font-medium">Type:</span> {session.interviewType}
            </div>
          )}
        </div>
      </Card>

      {/* Agent Controls */}
      <div className="flex space-x-2">
        <Button
          onClick={initializeAgent}
          disabled={isConnected}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {isConnected ? 'Connected' : 'Connect Agent'}
        </Button>
        
        <Button
          onClick={disconnectAgent}
          disabled={!isConnected}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Disconnect
        </Button>
      </div>

      {/* Conversation Summary */}
      {conversationHistory.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-2">Questions Asked: {conversationHistory.filter(m => m.role === 'interviewer').length}</h4>
          <div className="text-xs text-gray-500">
            Recent topics: Technical skills, Experience, Problem-solving...
          </div>
        </Card>
      )}
    </div>
  );
}