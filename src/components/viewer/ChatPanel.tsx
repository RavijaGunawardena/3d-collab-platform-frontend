import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  MessageCircle,
  X,
  Clock,
  Smile,
  CheckCheck,
  Check,
  Zap,
  Globe,
  Activity,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

import { ChatMessage } from "@/types/chat.types";
import { chatService } from "@/services/chatService";
import { useChat } from "@/hooks/useSocket";
import { tokenManager } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatPanelProps {
  projectId: string;
  className?: string;
  onClose?: () => void;
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
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages: realtimeMessages,
    typingUsers,
    sendMessage,
    setTyping,
  } = useChat(projectId);

  // Fetch message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const data = await chatService.getRecentMessages(projectId, 50);
        setMessageHistory(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Connection Issue", {
          description:
            "Unable to load chat history. Messages will sync when connection is restored.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [projectId]);

  // Combine message history with real-time messages
  const allMessages = [...messageHistory, ...realtimeMessages];

  // Enhanced auto-scroll behavior
  useEffect(() => {
    if (!isUserScrolling && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [allMessages.length, isUserScrolling]);

  // Auto-focus and keyboard shortcuts
  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobile && onClose) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSendMessage(e as any);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, onClose]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || isSending) return;

    try {
      setIsSending(true);

      // Add to realtime messages for immediate feedback
      sendMessage(messageInput.trim());

      // Clear input and reset states
      setMessageInput("");
      setTyping(false);

      // Focus back to input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Message Failed", {
        description:
          "Your message couldn't be sent. Please check your connection.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Enhanced typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    setTyping(value.length > 0);
  };

  // Smart time formatting
  const formatTime = (date: Date | string): string => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440)
      return messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Enhanced initials with colors
  const getInitials = (username: string): string => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent colors for users
  const getUserColor = (username: string): string => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
      "from-cyan-500 to-cyan-600",
      "from-yellow-500 to-yellow-600",
    ];

    const hash = username.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  // Extract username from message
  const getMessageUsername = (message: any): string => {
    if (message.userId && typeof message.userId === "object") {
      return message.userId.username;
    }
    return message.username || "Unknown User";
  };

  // Enhanced message rendering
  const renderMessage = (message: any, index: number) => {
    const type = message.type || "text";
    const username = getMessageUsername(message);
    const text = message.message;
    const timestamp = message.createdAt;
    const isOwnMessage = username === user?.username;
    const userColor = getUserColor(username);

    // System/notification messages
    if (type === "system" || type === "notification") {
      return (
        <div
          key={message._id || index}
          className="py-3 px-4 flex justify-center"
        >
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-700/30">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-chart-1 rounded-full animate-pulse" />
              <span className="text-slate-300">{text}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={message._id || index}
        className={`group px-3 sm:px-4 py-3 hover:bg-slate-800/10 transition-all duration-300 ${
          isOwnMessage ? "flex flex-row-reverse" : "flex"
        }`}
        onMouseEnter={() => setHoveredMessage(message._id || `${index}`)}
        onMouseLeave={() => setHoveredMessage(null)}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isOwnMessage ? "ml-3" : "mr-3"}`}>
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-slate-700/30 hover:ring-slate-600/50 transition-all duration-200">
            <AvatarFallback
              className={`text-xs font-semibold text-white bg-gradient-to-br ${userColor}`}
            >
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Message Content */}
        <div
          className={`flex-1 min-w-0 max-w-[80%] ${
            isOwnMessage ? "text-right" : ""
          }`}
        >
          {/* Message Header */}
          <div
            className={`flex items-baseline gap-2 mb-2 ${
              isOwnMessage ? "justify-end flex-row-reverse" : ""
            }`}
          >
            <span className="font-medium text-slate-200 text-sm truncate">
              {isOwnMessage ? "You" : username}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-xs text-slate-500 transition-opacity duration-200 ${
                  hoveredMessage === (message._id || `${index}`)
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {formatTime(timestamp)}
              </span>
              {isOwnMessage && (
                <div
                  className={`transition-opacity duration-200 ${
                    hoveredMessage === (message._id || `${index}`)
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  {message.status === "sending" ? (
                    <Clock className="w-3 h-3 text-slate-500" />
                  ) : message.status === "sent" ? (
                    <Check className="w-3 h-3 text-slate-500" />
                  ) : (
                    <CheckCheck className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message Bubble */}
          <div className="relative group/bubble">
            <div
              className={`
                inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed relative
                ${
                  isOwnMessage
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg shadow-lg shadow-primary/20"
                    : "bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 rounded-bl-lg border border-slate-700/50"
                }
                hover:shadow-xl transition-all duration-300
                break-words max-w-full
              `}
              style={{ wordBreak: "break-word" }}
            >
              {text}

              {/* Message reactions placeholder */}
              <div
                className={`absolute -bottom-1 ${
                  isOwnMessage ? "left-0" : "right-0"
                } opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 bg-slate-800/80 hover:bg-slate-700 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add reaction logic here
                  }}
                >
                  <Smile className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div
        className={`flex flex-col h-full bg-gradient-to-b from-slate-900/40 to-slate-900/60 backdrop-blur-xl ${className}`}
      >
        {/* Enhanced Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-xl border border-primary/30">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    Team Chat
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-slate-800/50 text-slate-300 border-slate-700"
                  >
                    <Hash className="w-2.5 h-2.5 mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span>
                    {allMessages.length} message
                    {allMessages.length !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Real-time
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online indicator */}
              {typingUsers.length === 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-400 font-medium">
                        Online
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connected to chat server</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Mobile close button */}
              {isMobile && onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-800/50 h-8 w-8 p-0 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 relative">
          <ScrollArea
            className="h-full"
            onScrollCapture={(e) => {
              const target = e.target as HTMLElement;
              const isAtBottom =
                target.scrollTop + target.clientHeight >=
                target.scrollHeight - 10;
              setIsUserScrolling(!isAtBottom);
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4 animate-in">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <MessageCircle className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      Loading Chat
                    </p>
                    <p className="text-xs text-slate-400">
                      Syncing conversation history...
                    </p>
                  </div>
                </div>
              </div>
            ) : allMessages.length === 0 ? (
              <div className="text-center py-16 px-4 text-slate-400">
                <div className="max-w-[240px] mx-auto space-y-4 animate-in">
                  <div className="relative">
                    <div className="h-16 w-16 mx-auto bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center border border-slate-600/30">
                      <MessageCircle className="h-8 w-8 opacity-50" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">
                      Ready to Collaborate
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Start the conversation! Share ideas, feedback, and
                      collaborate in real-time with your team.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-4">
                {allMessages.map((msg, index) => renderMessage(msg, index))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Scroll to bottom button */}
          {isUserScrolling && (
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                size="sm"
                onClick={() => {
                  setIsUserScrolling(false);
                  messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/25 rounded-full h-8 w-8 p-0"
              >
                <Activity className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-slate-800/30 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {typingUsers.slice(0, 3).map((username) => (
                  <Avatar
                    key={username}
                    className="w-6 h-6 border-2 border-slate-800"
                  >
                    <AvatarFallback
                      className={`text-xs bg-gradient-to-br ${getUserColor(
                        username
                      )}`}
                    >
                      {getInitials(username)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing`
                    : typingUsers.length === 2
                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                    : `${typingUsers.length} people are typing`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Input Area */}
        <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/60 backdrop-blur-sm">
          <div className="p-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex gap-3">
                {/* Message Input */}
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={isSending}
                    className="pr-12 h-12 bg-slate-800/50 border-slate-700/50 focus:border-primary/50 hover:border-slate-600/50 text-white placeholder-slate-400 rounded-xl transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                    maxLength={1000}
                  />

                  {/* Input actions */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300"
                          disabled={isSending}
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add emoji</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="h-12 w-12 p-0 bg-gradient-to-br from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Enhanced Footer */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="hidden sm:inline">
                    Press Enter to send • Ctrl+Enter for new line
                  </span>
                  <span className="sm:hidden">
                    Tap send to share your message
                  </span>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Live collaboration</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors duration-200 ${
                      messageInput.length > 900
                        ? "text-orange-400"
                        : messageInput.length > 0
                        ? "text-primary"
                        : "text-slate-500"
                    }`}
                  >
                    {messageInput.length}/1000
                  </span>
                  {messageInput.length > 900 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20"
                    >
                      {1000 - messageInput.length} left
                    </Badge>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ChatPanel;
