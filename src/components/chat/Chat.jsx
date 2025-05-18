import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import Sidebar from "@/components/layout/Sidebar";
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { StreamingMessage } from './StreamingMessage';

export default function Chat() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const scrollRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState(null);
  const eventSourceRef = useRef(null);

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

  // Function to start chat stream
  const startChatStream = (sessionId, message) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Add user message immediately
    setLocalMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingSources(null);

    // Create new EventSource
    const eventSource = new EventSource(
      `http://localhost:3000/api/chat?sessionId=${sessionId}&message=${encodeURIComponent(message)}`
    );
    eventSourceRef.current = eventSource;

    // Handle incoming chunks
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStreamingContent(prev => prev + data.chunk + ' ');
    };

    // Handle sources
    eventSource.addEventListener('sources', (event) => {
      const data = JSON.parse(event.data);
      setStreamingSources(data.sources);
    });

    // Handle completion
    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      if (data.success) {
        // Add the complete message to local messages
        setLocalMessages(prev => [...prev, {
          role: 'assistant',
          content: streamingContent,
          sources: streamingSources
        }]);
        
        // Update session title if this is the first message
        if (localMessages.length === 0) {
          updateSessionTitle(sessionId, message);
        }
      }
      
      // Clean up
      eventSource.close();
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingSources(null);
      
      // Refetch history to ensure consistency
      refetchHistory();
    });

    // Handle errors
    eventSource.addEventListener('error', (event) => {
      console.error('Stream error:', event);
      eventSource.close();
      setIsStreaming(false);
      // Remove the last message if it was an error
      setLocalMessages(prev => prev.slice(0, -1));
    });
  };

  // Update sendMessage mutation
  const sendMessage = useMutation({
    mutationFn: async (message) => {
      try {
        startChatStream(sessionId, message);
        return { success: true };
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: () => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        sessions={sessions}
        activeSession={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader 
          title={sessions.find(s => s.id === sessionId)?.title}
          onClearChat={() => clearHistory.mutate()}
          isClearing={clearHistory.isPending}
        />

        <div className="flex-1 overflow-hidden p-4">
          <ChatMessages 
            messages={localMessages}
            isLoading={isHistoryLoading}
            isPending={sendMessage.isPending}
            scrollRef={scrollRef}
            streamingContent={streamingContent}
            streamingSources={streamingSources}
            isStreaming={isStreaming}
          />
        </div>

        <ChatInput 
          message={message}
          onMessageChange={setMessage}
          onSubmit={handleSubmit}
          isPending={sendMessage.isPending || isStreaming}
        />
      </div>
    </div>
  );
}