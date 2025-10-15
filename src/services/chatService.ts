import { api } from "@/services/api";
import {
  ChatMessage,
  SendMessageInput,
  GetMessagesInput,
} from "@/types/chat.types";

/**
 * Chat Service
 * Handles all chat-related API calls
 */
class ChatService {
  /**
   * Send a chat message
   *
   * @param data - Message data
   * @returns Created message
   */
  async sendMessage(data: SendMessageInput): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>("/chat/messages", data);
    return response;
  }

  /**
   * Get messages for a project
   *
   * @param projectId - Project ID
   * @param query - Query parameters
   * @returns Array of messages
   */
  async getMessages(
    projectId: string,
    query?: Omit<GetMessagesInput, "projectId">
  ): Promise<ChatMessage[]> {
    const params = new URLSearchParams();

    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.skip) params.append("skip", query.skip.toString());
    if (query?.type) params.append("type", query.type);

    const response = await api.get<ChatMessage[]>(
      `/chat/projects/${projectId}/messages?${params.toString()}`
    );

    return response;
  }

  /**
   * Get recent messages for a project
   *
   * @param projectId - Project ID
   * @param limit - Number of messages to retrieve
   * @returns Array of recent messages
   */
  async getRecentMessages(
    projectId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(
      `/chat/projects/${projectId}/recent?limit=${limit}`
    );

    return response;
  }

  /**
   * Count messages for a project
   *
   * @param projectId - Project ID
   * @returns Message count
   */
  async countMessages(projectId: string): Promise<number> {
    const response = await api.get<{ count: number }>(
      `/chat/projects/${projectId}/count`
    );

    return response.count;
  }

  /**
   * Cleanup old messages (keep last N messages)
   *
   * @param projectId - Project ID
   * @param keepLast - Number of messages to keep
   * @returns Number of deleted messages
   */
  async cleanupMessages(
    projectId: string,
    keepLast: number = 1000
  ): Promise<number> {
    const response = await api.delete<{ deletedCount: number }>(
      `/chat/projects/${projectId}/cleanup?keepLast=${keepLast}`
    );

    return response.deletedCount;
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
