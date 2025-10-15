import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { ChatMessage, MessageType } from "@/types/chat.types";
import { chatService } from "@/services/chatService";
import { useChat } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

/**
 * Chat Panel Props
 */
interface ChatPanelProps {
  projectId: string;
}

/**
 * Chat Panel Component
 * Real-time chat with message history
 */
export function ChatPanel({ projectId }: ChatPanelProps) {
  const { user } = useAuthStore();
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

  /**
   * Fetch message history
   */
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

  /**
   * Merge realtime messages with history
   */
  const allMessages = [...messageHistory, ...realtimeMessages];

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages.length]);

  /**
   * Handle send message
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || isSending) return;

    try {
      setIsSending(true);
      sendMessage(messageInput.trim());
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

  /**
   * Handle typing indicator
   */
  const handleInputChange = (value: string) => {
    setMessageInput(value);

    // Emit typing status
    if (value.length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (date: Date | string): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Get initials for avatar
   */
  const getInitials = (username: string): string => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Get message type styling
   */
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

  /**
   * Render message
   */
  const renderMessage = (msg: ChatMessage | any) => {
    const message = msg.message || msg;
    const type = msg.type || message.type || "text";
    const username = msg.username || message.username || "Unknown";
    const text = typeof message === "string" ? message : message.message;
    const timestamp = msg.timestamp || msg.createdAt || message.createdAt;

    if (type === "system" || type === "notification") {
      return <div className={`py-2 px-4 ${getMessageStyle(type)}`}>{text}</div>;
    }

    const isOwnMessage = username === user?.username;

    return (
      <div
        className={`flex gap-3 px-4 py-2 hover:bg-slate-800/30 ${
          isOwnMessage ? "flex-row-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : ""}`}>
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

          <div
            className={`inline-block px-3 py-2 rounded-lg text-sm ${
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
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 px-4">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allMessages.map((msg, index) => (
              <div key={`${msg.id || msg.messageId || index}`}>
                {renderMessage(msg)}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-slate-400 italic">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      <Separator />

      {/* Input Area */}
      <div className="p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-slate-800 border-slate-700 focus:border-slate-600"
            maxLength={1000}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageInput.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send • {messageInput.length}/1000
        </p>
      </div>
    </div>
  );
}

export default ChatPanel;
