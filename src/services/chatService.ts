import {
  ChatMessage,
  SendMessageInput,
  GetMessagesInput,
} from "@/types/chat.types";
import { BackendApiResponse } from "@/types/project.types";
import { apiClient } from "./api";
import { apiEndpoints } from "@/config/env";

/**
 * Chat Service
 * Handles all chat-related API calls to match backend structure
 */
class ChatService {
  /**
   * Send a new message
   */
  async sendMessage(data: SendMessageInput): Promise<ChatMessage> {
    const response = await apiClient.post<BackendApiResponse<ChatMessage>>(
      apiEndpoints.chat.send,
      data
    );

    if (!response.data.data) {
      throw new Error("No message data received from server");
    }

    return response.data.data;
  }

  /**
   * Get recent messages for a project
   */
  async getRecentMessages(
    projectId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {

    // console.log("PROJECTID", projectId)

    const response = await apiClient.get<BackendApiResponse<ChatMessage[]>>(
      `${apiEndpoints.chat.recentMessages(projectId)}?limit=${limit}`
    );

    return response.data.data || [];
  }

  /**
   * Get messages with pagination and filtering
   */
  async getMessages(query: GetMessagesInput): Promise<ChatMessage[]> {
    const params = new URLSearchParams();

    if (query.limit) params.append("limit", query.limit.toString());
    if (query.skip) params.append("skip", query.skip.toString());
    if (query.type) params.append("type", query.type);

    const response = await apiClient.get<BackendApiResponse<ChatMessage[]>>(
      `${apiEndpoints.chat.messages(query.projectId)}?${params.toString()}`
    );

    return response.data.data || [];
  }

  /**
   * Get message count for a project
   */
  async getMessageCount(projectId: string): Promise<number> {
    const response = await apiClient.get<BackendApiResponse<{ count: number }>>(
      `${apiEndpoints.chat.count(projectId)}/${projectId}`
    );

    return response.data.data?.count || 0;
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
