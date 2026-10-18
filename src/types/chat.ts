export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  brandId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
