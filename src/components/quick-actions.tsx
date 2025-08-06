'use client'

import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";

interface QuickActionsProps {
  sessionId: string;
  onClearAll: () => void;
  onExportSession: () => void;
  onNewSession: () => void;
}

export function QuickActions({ 
  sessionId, 
  onClearAll, 
  onExportSession, 
  onNewSession 
}: QuickActionsProps) {
  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSession}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              Export Session
            </Button>
            <Button
              size="sm"
              onClick={onNewSession}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600"
            >
              New Session
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-xs text-gray-500">
            Session: <span className="font-medium text-gray-900">{sessionId}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-900"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}