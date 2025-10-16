import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { ChatMessage, MessageType } from "@/types/chat.types";
import { chatService } from "@/services/chatService";
import { useChat } from "@/hooks/useSocket";
import { tokenManager } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const user = tokenManager.getUser();
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages: realtimeMessages,
    typingUsers,
    sendMessage,
    setTyping,
  } = useChat(projectId);

  // Fetch message history on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const data = await chatService.getRecentMessages(projectId, 50);
        setMessageHistory(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to Load Messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [projectId]);

  // Combine message history with real-time messages
  const allMessages = [...messageHistory, ...realtimeMessages];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages.length]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || isSending) return;

    try {
      setIsSending(true);

      // Send via socket for real-time delivery
      sendMessage(messageInput.trim());

      // Clear input and stop typing indicator
      setMessageInput("");
      setTyping(false);

      // Focus back to input
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to Send Message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    setTyping(value.length > 0);
  };

  // Format timestamp for display
  const formatTime = (date: Date | string): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get initials for avatar
  const getInitials = (username: string): string => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get message type styling
  const getMessageStyle = (type: MessageType) => {
    switch (type) {
      case "system":
        return "text-slate-400 italic text-center text-xs";
      case "notification":
        return "text-blue-400 text-center text-xs";
      default:
        return "";
    }
  };

  // Extract username from message object
  const getMessageUsername = (message: any): string => {
    // Handle populated user object
    if (message.userId && typeof message.userId === "object") {
      return message.userId.username;
    }
    // Handle direct username field
    if (message.username) {
      return message.username;
    }
    return "Unknown";
  };

  // Render individual message
  const renderMessage = (message: any, index: number) => {
    const type = message.type || "text";
    const username = getMessageUsername(message);
    const text = message.message;
    const timestamp = message.createdAt;

    // Render system/notification messages differently
    if (type === "system" || type === "notification") {
      return (
        <div
          key={message._id || index}
          className={`py-2 px-4 ${getMessageStyle(type)}`}
        >
          {text}
        </div>
      );
    }

    const isOwnMessage = username === user?.username;

    return (
      <div
        key={message._id || index}
        className={`flex gap-3 px-4 py-2 hover:bg-slate-800/30 transition-colors ${
          isOwnMessage ? "flex-row-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs bg-slate-700 text-slate-200">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : ""}`}>
          {/* Message Header */}
          <div className="flex items-baseline gap-2 mb-1">
            {!isOwnMessage && (
              <>
                <span className="text-sm font-medium text-slate-200">
                  {username}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTime(timestamp)}
                </span>
              </>
            )}
            {isOwnMessage && (
              <>
                <span className="text-xs text-slate-500">
                  {formatTime(timestamp)}
                </span>
                <span className="text-sm font-medium text-slate-200">You</span>
              </>
            )}
          </div>

          {/* Message Bubble */}
          <div
            className={`inline-block px-3 py-2 rounded-lg text-sm max-w-xs break-words ${
              isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-slate-800 text-slate-100"
            }`}
          >
            {text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30 border-l border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </h2>
          {allMessages.length > 0 && (
            <span className="text-xs text-slate-400">
              {allMessages.length} messages
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Loading messages...</span>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 px-4">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {allMessages.map((msg, index) => renderMessage(msg, index))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-slate-400 italic border-t border-slate-800/50">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-800">
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isSending}
              className="flex-1 bg-slate-800 border-slate-700 focus:border-slate-600 text-white placeholder-slate-400"
              maxLength={1000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!messageInput.trim() || isSending}
              className="bg-primary hover:bg-primary/90"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Character Count */}
          <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
            <span>Press Enter to send</span>
            <span>{messageInput.length}/1000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
