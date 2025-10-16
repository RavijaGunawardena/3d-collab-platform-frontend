import { useCallback, useEffect, useRef, useState } from "react";
import socketManager from "@/lib/socket";
import { tokenManager } from "@/services/api"; // Using your existing token manager
import { env } from "@/config/env";
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

export function useSocket() {
  const [status, setStatus] = useState<SocketStatus>(socketManager.getStatus());
  const [isConnected, setIsConnected] = useState(socketManager.isConnected());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = socketManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === "connected");
      if (newStatus === "error") {
        setError("Connection failed");
      } else {
        setError(null);
      }
    });

    if (!socketManager.isConnected()) {
      socketManager.connect().catch((err) => {
        console.error("Failed to connect socket:", err);
        setError(err.message);
      });
    }

    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await socketManager.connect();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
  }, []);

  return {
    status,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const eventHandler = ((...args: any[]) => {
      handlerRef.current(...(args as any));
    }) as ServerToClientEvents[K];

    socketManager.on(event, eventHandler);
    return () => socketManager.off(event, eventHandler);
  }, [event]);
}

export function useSocketEmit() {
  return useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ): boolean => {
      return socketManager.emit(event, ...args);
    },
    []
  );
}

export function useProjectRoom(projectId: string | null) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useSocket();
  const emit = useSocketEmit();
  const joinAttemptedRef = useRef(false);
  const currentProjectRef = useRef<string | null>(null);

  const joinProject = useCallback(async () => {
    if (
      !projectId ||
      !isConnected ||
      joinAttemptedRef.current ||
      currentProjectRef.current === projectId
    ) {
      return;
    }

    const token = tokenManager.getToken();
    if (!token) {
      setError("No authentication token");
      return;
    }

    setIsJoining(true);
    setError(null);
    joinAttemptedRef.current = true;
    currentProjectRef.current = projectId;

    const joinData: JoinProjectData = {
      projectId,
      token,
    };

    if (env.enableLogging) {
      console.log("Joining project:", projectId);
    }

    emit("project:join", joinData, (response: JoinProjectResponse) => {
      if (response.success) {
        setActiveUsers(response.activeUsers || []);
        setIsJoined(true);
        setError(null);
        if (env.enableLogging) {
          console.log("Successfully joined project", projectId);
        }
      } else {
        setError(response.error || "Failed to join project");
        setIsJoined(false);
        joinAttemptedRef.current = false;
        currentProjectRef.current = null;
        console.error("Failed to join project:", response.error);
      }
      setIsJoining(false);
    });
  }, [projectId, isConnected, emit]);

  const leaveProject = useCallback(() => {
    if (!projectId || !isJoined) return;

    emit("project:leave", { projectId });
    setIsJoined(false);
    setActiveUsers([]);
    joinAttemptedRef.current = false;
    currentProjectRef.current = null;
  }, [projectId, isJoined, emit]);

  useSocketEvent(
    "project:user-joined",
    useCallback((data) => {
      setActiveUsers((prev) => {
        const exists = prev.some((u) => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
    }, [])
  );

  useSocketEvent(
    "project:user-left",
    useCallback((data) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    }, [])
  );

  useEffect(() => {
    if (
      isConnected &&
      projectId &&
      !isJoined &&
      !isJoining &&
      !joinAttemptedRef.current
    ) {
      const timer = setTimeout(() => {
        joinProject();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isConnected, projectId, isJoined, isJoining, joinProject]);

  useEffect(() => {
    if (projectId !== currentProjectRef.current) {
      setIsJoined(false);
      setActiveUsers([]);
      joinAttemptedRef.current = false;
      setError(null);
    }
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (isJoined && currentProjectRef.current) {
        emit("project:leave", { projectId: currentProjectRef.current });
      }
    };
  }, []);

  return {
    activeUsers,
    isJoined,
    isJoining,
    error,
    joinProject,
    leaveProject,
  };
}

export function useCameraSync(
  projectId: string | null,
  onCameraUpdate?: (data: any) => void
) {
  const emit = useSocketEmit();
  const lastUpdateTime = useRef<number>(0);
  const updateThrottle = 3000;

  const updateCamera = useCallback(
    (cameraState: any) => {
      if (!projectId) return;

      const user = tokenManager.getUser();
      if (!user) return;

      const now = Date.now();
      if (now - lastUpdateTime.current < updateThrottle) {
        return;
      }

      const cameraData: CameraUpdateData = {
        projectId,
        cameraState,
        userId: user.id,
        username: user.username,
      };

      const success = emit("camera:update", cameraData);
      if (success) {
        lastUpdateTime.current = now;
      }
    },
    [projectId, emit]
  );

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

  return { updateCamera };
}

export function useChat(projectId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const emit = useSocketEmit();
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  const sendMessage = useCallback(
    (message: string) => {
      if (!projectId || !message.trim()) return;

      const messageData: ChatMessageData = {
        projectId,
        message: message.trim(),
      };

      emit("chat:message", messageData, (response: ChatMessageResponse) => {
        if (response.success) {
          if (env.enableLogging) {
            console.log("Message sent successfully");
          }
        } else {
          console.error("Failed to send message:", response.error);
        }
      });
    },
    [projectId, emit]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!projectId) return;

      emit("chat:typing", { projectId, isTyping });

      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          emit("chat:typing", { projectId, isTyping: false });
        }, 3000);
      }
    },
    [projectId, emit]
  );

  useSocketEvent(
    "chat:message",
    useCallback((data: ChatMessageEvent) => {
      setMessages((prev) => [...prev, data.message]);
    }, [])
  );

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

  useEffect(() => {
    setMessages([]);
    setTypingUsers(new Set());
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    setTyping,
  };
}

export function useAnnotationSync(
  projectId: string | null,
  onAnnotationCreated?: (data: any) => void,
  onAnnotationUpdated?: (data: any) => void,
  onAnnotationDeleted?: (data: any) => void
) {
  const emit = useSocketEmit();

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

  const updateAnnotation = useCallback(
    (annotationId: string, updates: any) => {
      if (!projectId) return;
      emit("annotation:update", { projectId, annotationId, updates });
    },
    [projectId, emit]
  );

  const deleteAnnotation = useCallback(
    (annotationId: string) => {
      if (!projectId) return;
      emit("annotation:delete", { projectId, annotationId });
    },
    [projectId, emit]
  );

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
