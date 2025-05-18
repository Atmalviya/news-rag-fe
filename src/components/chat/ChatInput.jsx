import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

export const ChatInput = ({ 
  message, 
  onMessageChange, 
  onSubmit, 
  isPending 
}) => {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t bg-gray-50">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Ask about the news..."
          disabled={isPending}
          className="flex-1 bg-white"
        />
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </form>
  );
}; 