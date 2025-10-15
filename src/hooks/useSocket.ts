import socketManager from "@/lib/socket";
import { tokenManager } from "@/services/api";
import {
  ClientToServerEvents,
  JoinProjectData,
  JoinProjectResponse,
  ServerToClientEvents,
  SocketStatus,
} from "@/types/socket.types";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSocket() {
  const [status, setStatus] = useState<SocketStatus>(socketManager.getStatus());
  const [isConnected, setIsConnected] = useState(socketManager.isConnected());

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = socketManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === "connected");
    });

    // Connect if not connected
    if (!socketManager.isConnected()) {
      const token = tokenManager.getToken();
      if (token) {
        socketManager.connect();
      }
    } else {
      setIsConnected(true);
    }

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(() => {
    socketManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
  }, []);

  return {
    status,
    isConnected,
    connect,
    disconnect,
  };
}

/**
 * Socket Event Listener Hook
 * Generic hook for listening to socket events
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
) {
  const handlerRef = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = socketManager.getSocket();

    if (!socket) {
      console.warn(`Socket not available for event: ${String(event)}`);
      return;
    }

    // Wrapper to always use latest handler
    const eventHandler = ((...args: any[]) => {
      handlerRef.current(...(args as any));
    }) as ServerToClientEvents[K];

    socketManager.on(event, eventHandler);

    // Cleanup
    return () => {
      socketManager.off(event, eventHandler);
    };
  }, [event]);
}

/**
 * Socket Emit Hook
 * Provides type-safe emit function
 */
export function useSocketEmit() {
  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ): boolean => {
      return socketManager.emit(event, ...args);
    },
    []
  );

  return emit;
}

/**
 * Project Room Hook
 * Manages joining/leaving project rooms
 */
export function useProjectRoom(projectId: string | null) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useSocket();
  const emit = useSocketEmit();

  /**
   * Join project room
   */
  const joinProject = useCallback(async () => {
    if (!projectId || !isConnected) {
      console.warn("Cannot join project: missing projectId or not connected");
      return;
    }

    const token = tokenManager.getToken();
    if (!token) {
      setError("No authentication token");
      return;
    }

    setIsJoining(true);
    setError(null);

    const joinData: JoinProjectData = {
      projectId,
      token,
    };

    emit("project:join", joinData, (response: JoinProjectResponse) => {
      if (response.success) {
        setActiveUsers(response.activeUsers || []);
        setIsJoined(true);
        setError(null);
      } else {
        setError(response.error || "Failed to join project");
        setIsJoined(false);
      }
      setIsJoining(false);
    });
  }, [projectId, isConnected, emit]);

  /**
   * Leave project room
   */
  const leaveProject = useCallback(() => {
    if (!projectId || !isJoined) return;

    emit("project:leave", { projectId });
    setIsJoined(false);
    setActiveUsers([]);
  }, [projectId, isJoined, emit]);

  /**
   * Handle user joined event
   */
  useSocketEvent(
    "project:user-joined",
    useCallback((data) => {
      setActiveUsers((prev) => {
        // Check if user already exists
        const exists = prev.some((u) => u.userId === data.userId);
        if (exists) return prev;

        return [
          ...prev,
          {
            userId: data.userId,
            username: data.username,
          },
        ];
      });
    }, [])
  );

  /**
   * Handle user left event
   */
  useSocketEvent(
    "project:user-left",
    useCallback((data) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    }, [])
  );

  /**
   * Auto-join when connected and projectId is available
   */
  useEffect(() => {
    if (isConnected && projectId && !isJoined && !isJoining) {
      joinProject();
    }
  }, [isConnected, projectId, isJoined, isJoining, joinProject]);

  /**
   * Auto-leave on unmount or projectId change
   */
  useEffect(() => {
    return () => {
      if (isJoined && projectId) {
        emit("project:leave", { projectId });
      }
    };
  }, [projectId, isJoined, emit]);

  return {
    activeUsers,
    isJoined,
    isJoining,
    error,
    joinProject,
    leaveProject,
  };
}

/**
 * Camera Sync Hook
 * Manages real-time camera synchronization
 */
export function useCameraSync(
  projectId: string | null,
  onCameraUpdate?: (data: any) => void
) {
  const emit = useSocketEmit();

  /**
   * Update camera state
   */
  const updateCamera = useCallback(
    (cameraState: any) => {
      if (!projectId) return;

      const user = tokenManager.getUser();
      if (!user) return;

      emit("camera:update", {
        projectId,
        cameraState,
        userId: user.id,
        username: user.username,
      });
    },
    [projectId, emit]
  );

  /**
   * Listen to camera updates from other users
   */
  useSocketEvent(
    "camera:updated",
    useCallback(
      (data) => {
        if (onCameraUpdate) {
          onCameraUpdate(data);
        }
      },
      [onCameraUpdate]
    )
  );

  return {
    updateCamera,
  };
}

/**
 * Chat Hook
 * Manages real-time chat
 */
export function useChat(projectId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const emit = useSocketEmit();

  /**
   * Send message
   */
  const sendMessage = useCallback(
    (message: string) => {
      if (!projectId || !message.trim()) return;

      emit("chat:message", { projectId, message }, (response) => {
        if (response.success) {
          // Message sent successfully
        }
      });
    },
    [projectId, emit]
  );

  /**
   * Set typing status
   */
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!projectId) return;

      emit("chat:typing", { projectId, isTyping });
    },
    [projectId, emit]
  );

  /**
   * Listen to new messages
   */
  useSocketEvent(
    "chat:message",
    useCallback((data) => {
      setMessages((prev) => [...prev, data]);
    }, [])
  );

  /**
   * Listen to typing events
   */
  useSocketEvent(
    "chat:typing",
    useCallback((data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.username);
        } else {
          newSet.delete(data.username);
        }
        return newSet;
      });
    }, [])
  );

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    setTyping,
  };
}

export default useSocket;
