import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketStatus,
} from "@/types/socket.types";
import { env } from "@/config/env";

type SocketIOClient = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketManager {
  private socket: SocketIOClient | null = null;
  private status: SocketStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = env.socketReconnectionAttempts;
  private reconnectDelay = env.socketReconnectionDelay;
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private connectionPromise: Promise<SocketIOClient> | null = null;

  async connect(): Promise<SocketIOClient> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  private async createConnection(): Promise<SocketIOClient> {
    return new Promise((resolve, reject) => {
      console.log("Creating socket connection to:", env.socketUrl);
      this.updateStatus("connecting");

      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(env.socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
        forceNew: true,
      });

      const timeoutId = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 15000);

      this.socket.on("connect", () => {
        clearTimeout(timeoutId);
        console.log("Socket connected:", this.socket?.id);
        this.reconnectAttempts = 0;
        this.updateStatus("connected");
        this.connectionPromise = null;
        resolve(this.socket!);
      });

      this.socket.on("disconnect", (reason) => {
        clearTimeout(timeoutId);
        console.log("Socket disconnected:", reason);
        this.updateStatus("disconnected");
        this.connectionPromise = null;

        if (reason === "io server disconnect") {
          setTimeout(() => this.reconnect(), this.reconnectDelay);
        }
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeoutId);
        console.error("Socket connection error:", error);
        this.reconnectAttempts++;
        this.updateStatus("error");
        this.connectionPromise = null;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(
            new Error(
              `Failed to connect after ${this.maxReconnectAttempts} attempts`
            )
          );
        } else {
          setTimeout(() => this.reconnect(), this.reconnectDelay);
        }
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      if (env.enableLogging) {
        this.socket.onAny((eventName, ...args) => {
          console.log(`Socket Event: ${eventName}`, args);
        });
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus("disconnected");
      this.connectionPromise = null;
    }
  }

  reconnect(): void {
    console.log("Reconnecting socket...");
    this.disconnect();
    this.connect().catch(console.error);
  }

  getSocket(): SocketIOClient | null {
    return this.socket;
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private updateStatus(status: SocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  onStatusChange(listener: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): boolean {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit ${String(event)}: Socket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, ...args);
      return true;
    } catch (error) {
      console.error(`Error emitting ${String(event)}:`, error);
      return false;
    }
  }

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

  removeAllListeners<K extends keyof ServerToClientEvents>(event?: K): void {
    if (!this.socket) return;
    if (event) {
      this.socket.removeAllListeners(event);
    } else {
      this.socket.removeAllListeners();
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;
