import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { ChatMessage, MessageType } from "@/types/chat.types";
import { chatService } from "@/services/chatService";
import { useChat } from "@/hooks/useSocket";
import { tokenManager } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ChatPanelProps {
  projectId: string;
  className?: string;
  onClose?: () => void; // For mobile modal close
  isMobile?: boolean;
}

export function ChatPanel({
  projectId,
  className = "",
  onClose,
  isMobile = false,
}: ChatPanelProps) {
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

  // Auto-focus input on desktop
  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

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

  // Handle typing indicator with debounce
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
          className={`py-3 px-4 ${getMessageStyle(type)}`}
        >
          <div className="flex items-center justify-center">
            <div className="bg-slate-800/50 rounded-full px-3 py-1 text-xs">
              {text}
            </div>
          </div>
        </div>
      );
    }

    const isOwnMessage = username === user?.username;

    return (
      <div
        key={message._id || index}
        className={`group px-3 sm:px-4 py-2 hover:bg-slate-800/20 transition-colors ${
          isOwnMessage ? "flex flex-row-reverse" : "flex"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 ${isOwnMessage ? "ml-2" : "mr-2 sm:mr-3"}`}
        >
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarFallback className="text-xs bg-slate-700 text-slate-200">
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Message Content */}
        <div
          className={`flex-1 min-w-0 max-w-[85%] sm:max-w-[75%] ${
            isOwnMessage ? "text-right" : ""
          }`}
        >
          {/* Message Header */}
          <div
            className={`flex items-baseline gap-2 mb-1 text-xs ${
              isOwnMessage ? "justify-end flex-row-reverse" : ""
            }`}
          >
            <span className="font-medium text-slate-200 truncate">
              {isOwnMessage ? "You" : username}
            </span>
            <span className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(timestamp)}
            </span>
          </div>

          {/* Message Bubble */}
          <div
            className={`inline-block px-3 py-2 rounded-2xl text-sm break-words ${
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-slate-800 text-slate-100 rounded-bl-md"
            }`}
            style={{ wordBreak: "break-word" }}
          >
            {text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900/30 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Chat
              </h2>
              <p className="text-xs text-slate-400">
                {allMessages.length} message
                {allMessages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online users indicator */}
            {typingUsers.length === 0 && (
              <div className="hidden sm:flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-400">Online</span>
              </div>
            )}

            {/* Mobile close button */}
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                <span className="text-sm text-slate-400">
                  Loading messages...
                </span>
              </div>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <div className="max-w-[200px] mx-auto space-y-3">
                <div className="h-12 w-12 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 opacity-50" />
                </div>
                <div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1 text-slate-500">
                    Start the conversation!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {allMessages.map((msg, index) => renderMessage(msg, index))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
            <span className="text-xs text-slate-400">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing`
                : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                : `${typingUsers.length} people are typing`}
            </span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/50">
        <div className="p-3 sm:p-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-slate-800/50 border-slate-700 focus:border-slate-600 text-white placeholder-slate-400 text-sm"
                maxLength={1000}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageInput.trim() || isSending}
                className="bg-primary hover:bg-primary/90 h-10 w-10 flex-shrink-0"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Character Count and Hints */}
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="hidden sm:inline">Press Enter to send</span>
              <span className="sm:hidden">Tap send or press Enter</span>
              <div className="flex items-center gap-2">
                <span
                  className={messageInput.length > 900 ? "text-yellow-500" : ""}
                >
                  {messageInput.length}/1000
                </span>
                {messageInput.length > 900 && (
                  <Badge variant="secondary" className="text-xs">
                    {1000 - messageInput.length} left
                  </Badge>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
