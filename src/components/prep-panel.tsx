'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Brain, Target, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrepMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PrepInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  practiceAreas: string[];
}

interface PrepPanelProps {
  resumeData?: any;
  jobData?: any;
  onPrepCompleted: (insights: PrepInsights) => void;
}

export function PrepPanel({ resumeData, jobData, onPrepCompleted }: PrepPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<PrepMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<PrepInsights | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Initialize conversation with AI
    if (messages.length === 0) {
      const initialMessage: PrepMessage = {
        role: 'assistant',
        content: `Hello! I'm here to help you prepare for your interview${jobData ? ` at ${jobData.companyName || 'the company'}` : ''}. 

Let's discuss your experience and practice potential interview questions. I'll analyze our conversation to provide personalized insights and recommendations.

To get started, tell me about:
Your most relevant work experience for this role
A challenging project you've worked on recently
What excites you most about this opportunity

What would you like to discuss first?`,
        timestamp: Date.now(),
      };
      setMessages([initialMessage]);
    }
  }, [jobData, messages.length]);

  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim()) return;

    const userMessage: PrepMessage = {
      role: 'user',
      content: currentMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/prep/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          conversation: messages,
          resumeData,
          jobData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: PrepMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update insights if provided
      if (data.insights) {
        setInsights(data.insights);
        onPrepCompleted(data.insights);
      }
    } catch (error) {
      toast({
        title: "Message failed",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentMessage, messages, resumeData, jobData, onPrepCompleted, toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const generateInsights = useCallback(async () => {
    if (messages.length < 4) {
      toast({
        title: "More conversation needed",
        description: "Have a longer conversation to generate meaningful insights.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/prep/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: messages,
          resumeData,
          jobData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
      onPrepCompleted(data.insights);

      toast({
        title: "Insights generated",
        description: "Your preparation analysis is ready.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Could not generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, resumeData, jobData, onPrepCompleted, toast]);

  const suggestedQuestions = [
    "Tell me about your experience with [specific technology]",
    "How do you handle challenging team situations?",
    "Describe a time you had to learn something quickly",
    "What's your approach to problem-solving?",
    "Why are you interested in this role?",
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <span>Interview Preparation Chat</span>
          </CardTitle>
          <CardDescription>
            Practice with AI to fine-tune your responses for the actual interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="border rounded-lg h-96">
              <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Textarea
                placeholder="Share your thoughts, ask for practice questions, or discuss your experience..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Try asking about:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Insights */}
            {messages.length >= 4 && !insights && (
              <Button
                onClick={generateInsights}
                disabled={isLoading}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                Generate Preparation Insights
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <span>Preparation Insights</span>
            </CardTitle>
            <CardDescription>
              AI analysis based on your conversation and profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h4 className="font-semibold text-green-600">Your Strengths</h4>
                </div>
                <div className="space-y-2">
                  {insights.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas to Improve */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <h4 className="font-semibold text-orange-600">Areas to Address</h4>
                </div>
                <div className="space-y-2">
                  {insights.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{weakness}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  <h4 className="font-semibold text-blue-600">Recommendations</h4>
                </div>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Areas */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <h4 className="font-semibold text-purple-600">Practice Focus</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.practiceAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}