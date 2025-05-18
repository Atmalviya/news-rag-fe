import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const ChatHeader = ({ 
  title, 
  onClearChat, 
  isClearing 
}) => {
  return (
    <div className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800">News Gpt</h1>
        {title && (
          <span className="text-sm text-gray-500">
            ({title})
          </span>
        )}
      </div>
      <Button
        variant="outline"
        onClick={onClearChat}
        disabled={isClearing}
        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Clear Chat
      </Button>
    </div>
  );
}; 