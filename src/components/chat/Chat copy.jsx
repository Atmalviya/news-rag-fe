import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, RefreshCw, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import Sidebar from "@/components/layout/Sidebar";

// Add a new component for formatted messages
const FormattedMessage = ({ content, role }) => {
  // Function to format the message content
  const formatContent = (text) => {
    // Split the content into sections based on newlines
    const sections = text.split('\n\n');
    
    return sections.map((section, index) => {
      // Check if this section starts with an asterisk
      if (section.startsWith('* ')) {
        // Split the section into heading and content
        const [heading, ...contentParts] = section.split('\n');
        const content = contentParts.join('\n').trim();
        
        return (
          <div key={index} className="mb-4">
            <h3 className="font-bold text-lg mb-2 text-gray-900">
              {heading.replace('* ', '')}
            </h3>
            <div className="pl-4">
              {content.split('\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-2 text-gray-700">{paragraph}</p>
              ))}
            </div>
          </div>
        );
      }
      
      // If no heading, just return the content
      return (
        <div key={index} className="mb-2">
          {section.split('\n').map((paragraph, pIndex) => (
            <p key={pIndex} className="mb-2 text-gray-700">{paragraph}</p>
          ))}
        </div>
      );
    });
  };

  return (
    <div
      className={`inline-block p-4 rounded-2xl max-w-[80%] ${
        role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-white text-gray-900 shadow-sm border'
      }`}
    >
      {role === 'assistant' ? (
        <div className="prose prose-sm max-w-none">
          {formatContent(content)}
        </div>
      ) : (
        content
      )}
    </div>
  );
};

export default function Chat() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState([]);
  const [localMessages, setLocalMessages] = useState([]); // For immediate message display
  const scrollRef = useRef(null);

  // Load sessions from localStorage on initial render
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Load last active session on initial render
  useEffect(() => {
    const lastSessionId = localStorage.getItem('lastActiveSession');
    if (lastSessionId) {
      setSessionId(lastSessionId);
    } else {
      // Only create new session if there's no last active session
      createNewSession();
    }
  }, []);

  // Create new session function
  const createNewSession = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/session');
      const sessionData = {
        id: response.data.sessionId,
        createdAt: Date.now(),
        title: 'New Chat'
      };
      setSessions(prev => [...prev, sessionData]);
      setSessionId(response.data.sessionId);
      localStorage.setItem('lastActiveSession', response.data.sessionId);
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  // Update session title when first message is sent
  const updateSessionTitle = (sessionId, firstMessage) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') }
        : session
    ));
  };

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (message) => {
      try {
        // Add message to local state immediately
        setLocalMessages(prev => [...prev, { role: 'user', content: message }]);
        
        const response = await axios.post('http://localhost:3000/api/chat', {
          sessionId,
          message,
        });

        // Update session title if this is the first message
        if (localMessages.length === 0) {
          updateSessionTitle(sessionId, message);
        }

        // Add response to local state
        setLocalMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.answer,
          sources: response.data.sources 
        }]);

        return response.data;
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove the loading message on error
        setLocalMessages(prev => prev.slice(0, -1));
        throw error;
      }
    },
    onSuccess: () => {
      refetchHistory();
      setMessage("");
    },
  });

  // Fetch chat history
  const { 
    data: history = [], 
    isLoading: isHistoryLoading,
    refetch: refetchHistory 
  } = useQuery({
    queryKey: ['history', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      try {
        const response = await axios.get(`http://localhost:3000/api/session/${sessionId}/history`);
        // Update local messages when history is fetched
        setLocalMessages(response.data.history);
        return response.data.history;
      } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
      }
    },
    enabled: !!sessionId,
  });

  // Clear history mutation
  const clearHistory = useMutation({
    mutationFn: async () => {
      try {
        await axios.delete(`http://localhost:3000/api/session/${sessionId}/history`);
      } catch (error) {
        console.error('Error clearing history:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Remove the current session from the sidebar
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Find another session to switch to
      const remainingSessions = sessions.filter(session => session.id !== sessionId);
      
      if (remainingSessions.length > 0) {
        // Switch to the most recent session
        const mostRecentSession = remainingSessions.reduce((latest, current) => 
          current.createdAt > latest.createdAt ? current : latest
        );
        handleSessionSelect(mostRecentSession.id);
      } else {
        // If no sessions remain, create a new one
        createNewSession();
      }
    },
  });

  // Handle new chat
  const handleNewChat = async () => {
    await createNewSession();
  };

  // Handle session selection
  const handleSessionSelect = (selectedSessionId) => {
    setSessionId(selectedSessionId);
    localStorage.setItem('lastActiveSession', selectedSessionId);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !sendMessage.isPending) {
      sendMessage.mutate(message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        sessions={sessions}
        activeSession={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">News Gpt</h1>
            {sessions.find(s => s.id === sessionId)?.title && (
              <span className="text-sm text-gray-500">
                ({sessions.find(s => s.id === sessionId)?.title})
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => clearHistory.mutate()}
            disabled={clearHistory.isPending}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <Card className="h-full flex flex-col shadow-lg">
            <ScrollArea 
              ref={scrollRef} 
              className="flex-1"
              style={{ height: 'calc(100vh - 200px)' }}
            >
              <div className="p-4">
                {isHistoryLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-gray-500">Loading messages...</div>
                  </div>
                ) : localMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <div className="text-2xl">👋</div>
                    <div className="text-center">
                      <p className="font-medium">Welcome to News Chat!</p>
                      <p className="text-sm mt-1">Ask me anything about the latest news.</p>
                    </div>
                  </div>
                ) : (
                  localMessages.map((msg, index) => (
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
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500 max-w-[80%] mx-auto">
                          <div className="font-medium mb-1">Sources:</div>
                          {msg.sources.map((source, idx) => (
                            <a
                              key={idx}
                              href={source.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <div className="font-medium">{source.title}</div>
                              <div className="text-xs text-gray-400">{source.source}</div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {sendMessage.isPending && (
                  <div className="flex items-center gap-2 text-gray-500 mb-6">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching response...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about the news..."
                  disabled={sendMessage.isPending}
                  className="flex-1 bg-white"
                />
                <Button 
                  type="submit" 
                  disabled={sendMessage.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}