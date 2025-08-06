'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  CheckCircle, 
  Clock,
  Brain,
  MessageSquare,
  Target
} from "lucide-react";
import { useSpeech } from '@/hooks/use-speech';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  type: 'behavioral' | 'technical' | 'situational' | 'company';
  question: string;
  tips: string[];
  expectedDuration: number; // in seconds
}

interface PrepSession {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  startTime?: Date;
  isActive: boolean;
}

const sampleQuestions: Question[] = [
  {
    id: '1',
    type: 'behavioral',
    question: 'Tell me about a time when you had to overcome a significant challenge at work.',
    tips: [
      'Use the STAR method (Situation, Task, Action, Result)',
      'Focus on your specific actions and contributions',
      'Quantify the impact when possible'
    ],
    expectedDuration: 120
  },
  {
    id: '2',
    type: 'technical',
    question: 'How would you design a system to handle millions of users?',
    tips: [
      'Start with clarifying questions about requirements',
      'Think about scalability, reliability, and performance',
      'Consider load balancing, caching, and database strategies'
    ],
    expectedDuration: 300
  },
  {
    id: '3',
    type: 'situational',
    question: 'How would you handle a situation where you disagree with your manager\'s decision?',
    tips: [
      'Show respect for authority while expressing your concerns',
      'Focus on data and reasoning rather than emotions',
      'Demonstrate collaboration and compromise'
    ],
    expectedDuration: 90
  },
  {
    id: '4',
    type: 'company',
    question: 'Why do you want to work for our company specifically?',
    tips: [
      'Research the company\'s mission, values, and recent news',
      'Connect your personal goals with the company\'s objectives',
      'Show genuine enthusiasm and specific knowledge'
    ],
    expectedDuration: 60
  }
];

interface InterviewPrepProps {
  onPrepComplete?: () => void;
}

export default function InterviewPrep({ onPrepComplete }: InterviewPrepProps = {}) {
  const [session, setSession] = useState<PrepSession>({
    questions: sampleQuestions,
    currentIndex: 0,
    answers: {},
    isActive: false
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  
  const { speak, stop, pause, resume, isLoading: speechLoading, isPlaying } = useSpeech({ 
    autoPlay: true
  });
  const { toast } = useToast();

  const currentQuestion = session.questions[session.currentIndex];

  // Timer effect for tracking answer duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session.isActive && isRecording) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.isActive, isRecording]);

  const startSession = () => {
    setSession(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      currentIndex: 0
    }));
    setTimer(0);
    setCurrentAnswer('');
    speakQuestion(currentQuestion.question);
  };

  const speakQuestion = async (question: string) => {
    const fullText = `Here's your interview question: ${question}. Take your time to think, and when you're ready, click the record button to start your answer.`;
    await speak(fullText);
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimer(0);
    if (isPlaying) {
      stop();
    }
    toast({
      title: "Recording started",
      description: "Start speaking your answer. The timer is now running.",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    // Save the answer
    setSession(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: currentAnswer
      }
    }));

    generateFeedback();
  };

  const generateFeedback = async () => {
    if (!currentAnswer.trim()) return;

    try {
      const response = await fetch('/api/prep/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: currentAnswer,
          type: currentQuestion.type,
          duration: timer
        }),
      });

      if (response.ok) {
        const { feedback: generatedFeedback } = await response.json();
        setFeedback(generatedFeedback);
        
        // Speak the feedback
        const feedbackText = `Here's your feedback: ${generatedFeedback}`;
        await speak(feedbackText);
      }
    } catch (error) {
      console.error('Feedback generation error:', error);
    }
  };

  const nextQuestion = () => {
    if (session.currentIndex < session.questions.length - 1) {
      const nextIndex = session.currentIndex + 1;
      setSession(prev => ({
        ...prev,
        currentIndex: nextIndex
      }));
      setCurrentAnswer('');
      setFeedback('');
      setTimer(0);
      
      const nextQuestion = session.questions[nextIndex];
      speakQuestion(nextQuestion.question);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setSession(prev => ({ ...prev, isActive: false }));
    setIsRecording(false);
    stop();
    
    const completionMessage = `Congratulations! You've completed your interview preparation session. You answered ${Object.keys(session.answers).length} questions. Great work preparing for your interview!`;
    speak(completionMessage);
    
    // Mark prep as complete if callback provided
    if (onPrepComplete) {
      onPrepComplete();
    }
    
    toast({
      title: "Session completed!",
      description: "Great job completing your interview prep session. You're now ready for live interviews!",
    });
  };

  const resetSession = () => {
    setSession({
      questions: sampleQuestions,
      currentIndex: 0,
      answers: {},
      isActive: false
    });
    setCurrentAnswer('');
    setFeedback('');
    setTimer(0);
    setIsRecording(false);
    stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'behavioral': return <MessageSquare className="w-4 h-4" />;
      case 'technical': return <Brain className="w-4 h-4" />;
      case 'situational': return <Target className="w-4 h-4" />;
      case 'company': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI-Powered Interview Preparation
          </CardTitle>
          <CardDescription>
            Practice with realistic interview questions and get instant AI feedback with voice guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session.isActive ? (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['behavioral', 'technical', 'situational', 'company'].map((type) => (
                  <div key={type} className="p-4 border rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      {getQuestionIcon(type)}
                    </div>
                    <div className="text-sm font-medium capitalize">{type}</div>
                    <div className="text-xs text-muted-foreground">
                      {sampleQuestions.filter(q => q.type === type).length} questions
                    </div>
                  </div>
                ))}
              </div>
              
              <Button onClick={startSession} size="lg" className="w-full max-w-md">
                <Play className="w-4 h-4 mr-2" />
                Start Interview Practice Session
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Questions will be read aloud, and you can practice your responses with voice feedback
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Question {session.currentIndex + 1} of {session.questions.length}</span>
                  <span>{Math.round(((session.currentIndex) / session.questions.length) * 100)}% Complete</span>
                </div>
                <Progress value={((session.currentIndex) / session.questions.length) * 100} />
              </div>

              {/* Current question */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getQuestionIcon(currentQuestion.type)}
                      {currentQuestion.type}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Expected: {formatTime(currentQuestion.expectedDuration)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-lg font-medium">{currentQuestion.question}</div>
                    
                    {/* Audio controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => speakQuestion(currentQuestion.question)}
                        disabled={speechLoading}
                      >
                        {speechLoading ? (
                          <Volume2 className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                        Replay Question
                      </Button>
                      
                      {isPlaying && (
                        <Button variant="outline" size="sm" onClick={pause}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm" onClick={stop}>
                        <Square className="w-4 h-4" />
                        Stop Audio
                      </Button>
                    </div>

                    {/* Tips */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Tips:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {currentQuestion.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Answer section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Your Answer</CardTitle>
                    <div className="flex items-center gap-2 text-lg font-mono">
                      <Clock className="w-4 h-4" />
                      {formatTime(timer)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your answer here or use the record button to practice speaking..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      rows={6}
                      className="enhanced-form-field"
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        onClick={isRecording ? stopRecording : startRecording}
                        className="flex items-center gap-2"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Stop Recording ({formatTime(timer)})
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Start Recording
                          </>
                        )}
                      </Button>
                      
                      {currentAnswer && !isRecording && (
                        <Button variant="outline" onClick={nextQuestion}>
                          {session.currentIndex < session.questions.length - 1 ? 'Next Question' : 'Finish Session'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback section */}
              {feedback && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      AI Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm">{feedback}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => speak(feedback)}
                        disabled={speechLoading}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Replay Feedback
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Session controls */}
          {session.isActive && (
            <div className="flex justify-center gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={resetSession}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}