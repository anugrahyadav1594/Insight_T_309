/**
 * AI Chat API service.
 *
 * POST /api/v1/ai/chat — contextual AI assistant for financial queries.
 */

import { apiClient } from "../api";
import type { ChatRequest, ChatReplyResponse } from "../types";

/** Send a chat message to the AI assistant. */
export async function chat(body: ChatRequest): Promise<ChatReplyResponse> {
  return apiClient.post<ChatReplyResponse>("/ai/chat", body);
}
