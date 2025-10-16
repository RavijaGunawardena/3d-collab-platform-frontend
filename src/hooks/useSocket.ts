import socketManager from "@/lib/socket";
import { tokenManager } from "@/services/api";
import {
  ActiveUser,
  ClientToServerEvents,
  JoinProjectData,
  JoinProjectResponse,
  ServerToClientEvents,
  SocketStatus,
  CameraUpdateData,
  ChatMessageData,
  ChatMessageResponse,
  ChatMessageEvent,
  TypingEvent,
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

    // Connect if not connected (no auth required on connect)
    if (!socketManager.isConnected()) {
      socketManager.connect();
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
 * Manages joining/leaving project rooms with proper authentication
 */
export function useProjectRoom(projectId: string | null) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useSocket();
  const emit = useSocketEmit();

  /**
   * Join project room (this is where authentication happens)
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

    console.log("PROHJEFT ID", joinData);

    // This is where authentication happens - backend verifies token
    emit("project:join", joinData, (response: JoinProjectResponse) => {
      if (response.success) {
        setActiveUsers(response.activeUsers || []);
        setIsJoined(true);
        setError(null);
        console.log("Successfully joined project", projectId);
      } else {
        setError(response.error || "Failed to join project");
        setIsJoined(false);
        console.error("Failed to join project:", response.error);
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
 * Manages real-time camera synchronization with 3-second throttling
 */
export function useCameraSync(
  projectId: string | null,
  onCameraUpdate?: (data: any) => void
) {
  const emit = useSocketEmit();
  const lastUpdateTime = useRef<number>(0);
  const updateThrottle = 3000; // 3 seconds as requested

  /**
   * Update camera state with throttling
   */
  const updateCamera = useCallback(
    (cameraState: any) => {
      if (!projectId) return;

      const user = tokenManager.getUser();
      if (!user) return;

      const now = Date.now();
      if (now - lastUpdateTime.current < updateThrottle) {
        return; // Skip update if within throttle period
      }

      const cameraData: CameraUpdateData = {
        projectId,
        cameraState,
        userId: user.id,
        username: user.username,
      };

      emit("camera:update", cameraData);
      lastUpdateTime.current = now;
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
 * Manages real-time chat with proper message handling
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

      const messageData: ChatMessageData = {
        projectId,
        message: message.trim(),
      };

      emit("chat:message", messageData, (response: ChatMessageResponse) => {
        if (response.success) {
          console.log("Message sent successfully");
        } else {
          console.error("Failed to send message:", response.error);
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
    useCallback((data: ChatMessageEvent) => {
      // Add new message to state (backend sends full message object)
      setMessages((prev) => [...prev, data.message]);
    }, [])
  );

  /**
   * Listen to typing events
   */
  useSocketEvent(
    "chat:typing",
    useCallback((data: TypingEvent) => {
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

  /**
   * Clear messages when project changes
   */
  useEffect(() => {
    setMessages([]);
    setTypingUsers(new Set());
  }, [projectId]);

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    setTyping,
  };
}

/**
 * Annotation Sync Hook
 * Manages real-time annotation synchronization
 */
export function useAnnotationSync(
  projectId: string | null,
  onAnnotationCreated?: (data: any) => void,
  onAnnotationUpdated?: (data: any) => void,
  onAnnotationDeleted?: (data: any) => void
) {
  const emit = useSocketEmit();

  /**
   * Create annotation via socket
   */
  const createAnnotation = useCallback(
    (annotationData: any, callback?: (response: any) => void) => {
      if (!projectId) return;

      emit(
        "annotation:create",
        { projectId, ...annotationData },
        (response) => {
          if (callback) callback(response);
        }
      );
    },
    [projectId, emit]
  );

  /**
   * Update annotation via socket
   */
  const updateAnnotation = useCallback(
    (annotationId: string, updates: any) => {
      if (!projectId) return;

      emit("annotation:update", { projectId, annotationId, updates });
    },
    [projectId, emit]
  );

  /**
   * Delete annotation via socket
   */
  const deleteAnnotation = useCallback(
    (annotationId: string) => {
      if (!projectId) return;

      emit("annotation:delete", { projectId, annotationId });
    },
    [projectId, emit]
  );

  /**
   * Listen to annotation events
   */
  useSocketEvent(
    "annotation:created",
    useCallback(
      (data) => {
        if (onAnnotationCreated) onAnnotationCreated(data);
      },
      [onAnnotationCreated]
    )
  );

  useSocketEvent(
    "annotation:updated",
    useCallback(
      (data) => {
        if (onAnnotationUpdated) onAnnotationUpdated(data);
      },
      [onAnnotationUpdated]
    )
  );

  useSocketEvent(
    "annotation:deleted",
    useCallback(
      (data) => {
        if (onAnnotationDeleted) onAnnotationDeleted(data);
      },
      [onAnnotationDeleted]
    )
  );

  return {
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
}

export default useSocket;
