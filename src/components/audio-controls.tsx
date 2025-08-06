'use client'

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Play, Settings } from "lucide-react";
import { useAudio } from "@/hooks/use-audio";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

interface AudioControlsProps {
  onTranscription?: (text: string, speaker: 'user' | 'interviewer') => void;
  sessionConfig?: any;
}

export function AudioControls({ onTranscription, sessionConfig }: AudioControlsProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const wsUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    : null;

  const { sendMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      toast({
        title: "Connected",
        description: "Connected to realtime transcription service.",
      });
    },
    onClose: () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    },
    onError: () => {
      setConnectionStatus('disconnected');
      toast({
        title: "Connection Error",
        description: "Failed to connect to transcription service.",
        variant: "destructive",
      });
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription' && data.text) {
          onTranscription?.(data.text, data.speaker || 'user');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });

  const { isRecording, audioLevel, startRecording, stopRecording } = useAudio({
    onDataAvailable: (audioBlob) => {
      if (isConnected) {
        // Convert blob to base64 and send via WebSocket
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          sendMessage(JSON.stringify({
            type: 'audio',
            data: base64.split(',')[1], // Remove data:audio/webm;base64, prefix
            config: sessionConfig
          }));
        };
        reader.readAsDataURL(audioBlob);
      }
    },
    onError: (error) => {
      toast({
        title: "Audio Error",
        description: `Failed to access microphone: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleStartRecording = useCallback(async () => {
    if (!isConnected) {
      setConnectionStatus('connecting');
      // WebSocket will auto-connect via useWebSocket hook
      return;
    }
    
    try {
      await startRecording();
      toast({
        title: "Recording Started",
        description: "Interview transcription is now active.",
      });
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [isConnected, startRecording, toast]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    toast({
      title: "Recording Stopped",
      description: "Interview transcription has been paused.",
    });
  }, [stopRecording, toast]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Audio Controls</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
          <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Audio Level Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Audio Level</span>
            <span className="text-xs text-gray-500">
              {Math.round(audioLevel * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-150"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={connectionStatus === 'connecting'}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              variant="destructive"
              className="flex items-center space-x-2 px-6 py-3"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="p-2"
            title="Audio Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${
                isRecording ? 'text-green-600' : 'text-gray-900'
              }`}>
                {isRecording ? 'Recording' : 'Standby'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Connection:</span>
              <span className={`ml-2 font-medium ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}