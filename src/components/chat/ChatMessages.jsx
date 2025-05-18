import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FormattedMessage } from './FormattedMessage';
import { Sources } from './Sources';
import { StreamingMessage } from './StreamingMessage';

export const ChatMessages = ({ 
  messages, 
  isLoading, 
  isPending, 
  scrollRef,
  streamingContent,
  streamingSources,
  isStreaming
}) => {
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <ScrollArea 
        ref={scrollRef} 
        className="flex-1"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className="text-2xl">👋</div>
              <div className="text-center">
                <p className="font-medium">Welcome to News Chat!</p>
                <p className="text-sm mt-1">Ask me anything about the latest news.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-6 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <FormattedMessage 
                    content={msg.content} 
                    role={msg.role} 
                  />
                  <Sources sources={msg.sources} />
                </div>
              ))}
              {isStreaming && (
                <div className="mb-6 text-left">
                  <FormattedMessage 
                    content={streamingContent}
                    role="assistant"
                  />
                  {streamingSources && <Sources sources={streamingSources} />}
                </div>
              )}
            </>
          )}
          {isPending && !isStreaming && (
            <div className="flex items-center gap-2 text-gray-500 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching response...</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}; 