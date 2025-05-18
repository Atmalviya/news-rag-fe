import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";

export default function Sidebar({ 
  sessions, 
  activeSession, 
  onSessionSelect, 
  onNewChat 
}) {
  return (
    <div className="w-72 h-screen border-r bg-white p-4 flex flex-col">
      <Button 
        onClick={onNewChat}
        className="mb-4 w-full bg-blue-500 hover:bg-blue-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Chat
      </Button>
      
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p>No chat history</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                activeSession === session.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${
                  activeSession === session.id ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {session.title || 'New Chat'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}