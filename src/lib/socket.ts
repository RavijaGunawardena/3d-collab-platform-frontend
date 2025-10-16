import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketStatus,
} from "@/types/socket.types";
import env from "@/config/env";

/**
 * Socket.IO Client Type
 */
type SocketIOClient = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Socket Manager Class
 * Handles Socket.IO connection lifecycle - NO AUTH ON CONNECT
 */
class SocketManager {
  private socket: SocketIOClient | null = null;
  private status: SocketStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = env.socketReconnectionAttempts || 5;
  private reconnectDelay = env.socketReconnectionDelay || 1000;
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();

  /**
   * Initialize socket connection - NO AUTHENTICATION REQUIRED
   * Backend handles auth during project:join event
   */
  connect(): SocketIOClient {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return this.socket;
    }

    console.log("Initializing Socket.IO connection...");
    this.updateStatus("connecting");

    // Connect WITHOUT authentication - backend handles auth during join
    this.socket = io(env.socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
      // NO AUTH HERE - handled in project:join
    });

    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
      this.updateStatus("connected");
    });

    // Disconnection
    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      this.updateStatus("disconnected");

      // Auto-reconnect for certain reasons
      if (reason === "io server disconnect") {
        // Server disconnected, manually reconnect
        this.reconnect();
      }
    });

    // Connection error
    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.reconnectAttempts++;
      this.updateStatus("error");

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        this.disconnect();
      }
    });

    // Handle server errors
    this.socket.on("error", (error) => {
      console.error("Socket server error:", error);
    });

    // Log all events in development
    if (env.enableLogging) {
      this.socket.onAny((eventName, ...args) => {
        console.log(`📡 Socket Event: ${eventName}`, args);
      });
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus("disconnected");
    }
  }

  /**
   * Reconnect socket
   */
  reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts + 1}/${
          this.maxReconnectAttempts
        })`
      );

      setTimeout(() => {
        this.disconnect();
        this.connect();
      }, this.reconnectDelay);
    }
  }

  /**
   * Get socket instance
   */
  getSocket(): SocketIOClient | null {
    return this.socket;
  }

  /**
   * Get connection status
   */
  getStatus(): SocketStatus {
    return this.status;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(status: SocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Emit event (type-safe wrapper)
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): boolean {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit ${String(event)}: Socket not connected`);
      return false;
    }

    this.socket.emit(event, ...args);
    return true;
  }

  /**
   * Listen to event (type-safe wrapper)
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      console.warn(`Cannot listen to ${String(event)}: Socket not initialized`);
      return;
    }

    this.socket.on(event, handler as any);
  }

  /**
   * Remove event listener (type-safe wrapper)
   */
  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;

    if (handler) {
      this.socket.off(event, handler as any);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<K extends keyof ServerToClientEvents>(event?: K): void {
    if (!this.socket) return;

    if (event) {
      this.socket.removeAllListeners(event);
    } else {
      this.socket.removeAllListeners();
    }
  }
}

/**
 * Singleton Socket Manager Instance
 */
export const socketManager = new SocketManager();

/**
 * Helper function to get socket instance
 */
export const getSocket = (): SocketIOClient | null => {
  return socketManager.getSocket();
};

/**
 * Helper function to ensure socket is connected
 */
export const ensureConnected = (): SocketIOClient => {
  if (!socketManager.isConnected()) {
    return socketManager.connect();
  }
  return socketManager.getSocket()!;
};

export default socketManager;
