import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSocket, useProjectRoom } from "@/hooks/useSocket";
import { tokenManager } from "@/services/api"; // Using your existing token manager
import socketManager from "@/lib/socket";
import { env } from "@/config/env";

interface SocketDebugPanelProps {
  projectId?: string;
}

export function SocketDebugPanel({ projectId }: SocketDebugPanelProps) {
  const { status, isConnected, error, connect, disconnect } = useSocket();
  const {
    activeUsers,
    isJoined,
    isJoining,
    error: roomError,
  } = useProjectRoom(projectId || null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket?.connected) {
      setSocketId(socket.id);
    } else {
      setSocketId(null);
    }
  }, [isConnected]);

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const logEvent = (eventName: string, ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      setEventLog((prev) => [
        `${timestamp} - ${eventName}: ${JSON.stringify(args).slice(0, 100)}...`,
        ...prev.slice(0, 9),
      ]);
    };

    socket.onAny(logEvent);
    return () => socket.offAny(logEvent);
  }, [isConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default";
      case "connecting":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const user = tokenManager.getUser();
  const token = tokenManager.getToken();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Socket.IO Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Connection Status:</span>
          <Badge variant={getStatusColor(status)}>{status.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Socket URL:</span>
            <p className="text-muted-foreground break-all">{env.socketUrl}</p>
          </div>
          <div>
            <span className="font-medium">Socket ID:</span>
            <p className="text-muted-foreground">
              {socketId || "Not connected"}
            </p>
          </div>
        </div>

        <Separator />
        <div className="space-y-2">
          <span className="font-medium">Authentication:</span>
          <div className="text-sm space-y-1">
            <p>User: {user?.username || "Not logged in"}</p>
            <p>Token: {token ? "Present" : "Missing"}</p>
          </div>
        </div>

        {projectId && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="font-medium">Project Room:</span>
              <div className="text-sm space-y-1">
                <p>Project ID: {projectId}</p>
                <p>Joined: {isJoined ? "Yes" : "No"}</p>
                <p>Joining: {isJoining ? "Yes" : "No"}</p>
                <p>Active Users: {activeUsers.length}</p>
                {activeUsers.length > 0 && (
                  <p className="text-muted-foreground">
                    {activeUsers.map((u) => u.username).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {(error || roomError) && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="font-medium text-red-500">Errors:</span>
              <div className="text-sm text-red-500">
                {error && <p>Socket: {error}</p>}
                {roomError && <p>Room: {roomError}</p>}
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={connect}
            disabled={isConnected}
            variant="outline"
          >
            Connect
          </Button>
          <Button
            size="sm"
            onClick={disconnect}
            disabled={!isConnected}
            variant="outline"
          >
            Disconnect
          </Button>
          <Button
            size="sm"
            onClick={() => socketManager.reconnect()}
            variant="outline"
          >
            Reconnect
          </Button>
        </div>

        <Separator />
        <div className="space-y-2">
          <span className="font-medium">Recent Events:</span>
          <div className="bg-muted p-2 rounded text-xs font-mono max-h-40 overflow-y-auto">
            {eventLog.length === 0 ? (
              <p className="text-muted-foreground">No events yet...</p>
            ) : (
              eventLog.map((event, index) => (
                <div key={index} className="mb-1 break-all">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
