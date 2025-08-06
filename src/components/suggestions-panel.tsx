'use client'

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, MoreVertical, Copy, Zap, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Suggestion {
  id: string;
  text: string;
  keyPoints: string[];
  estimatedDuration: string;
  confidence: number;
  type: 'primary' | 'alternative';
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function SuggestionsPanel({ suggestions, onRegenerate, isGenerating }: SuggestionsPanelProps) {
  const { toast } = useToast();
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Suggestion has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy suggestion to clipboard.",
        variant: "destructive",
      });
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSuggestions(newExpanded);
  };

  const primarySuggestion = suggestions.find(s => s.type === 'primary');
  const alternatives = suggestions.filter(s => s.type === 'alternative');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">AI Suggestions</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100"
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Regenerate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-500 hover:text-gray-900"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4">
          {isGenerating && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6">
                  <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-500">Generating suggestions...</p>
              </div>
            </div>
          )}

          {primarySuggestion && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 mb-2">Recommended Answer</p>
                  <p className="text-gray-900 leading-relaxed mb-3">{primarySuggestion.text}</p>
                  
                  {primarySuggestion.keyPoints.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium mb-2">Key points to mention:</p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {primarySuggestion.keyPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      <span>{primarySuggestion.estimatedDuration} response</span>
                      <span className="ml-2">
                        Confidence: {Math.round(primarySuggestion.confidence * 100)}%
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(primarySuggestion.text)}
                      className="p-1.5 text-gray-500 hover:text-gray-900"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Alternative Approaches</h3>
              {alternatives.map((suggestion) => (
                <div key={suggestion.id} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 leading-relaxed mb-3">{suggestion.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{suggestion.estimatedDuration}</span>
                          <span>•</span>
                          <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(suggestion.text)}
                          className="p-1.5 text-gray-500 hover:text-gray-900"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isGenerating && suggestions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">AI suggestions will appear here</p>
              <p className="text-gray-400 text-xs mt-1">Start recording to get contextual recommendations</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}