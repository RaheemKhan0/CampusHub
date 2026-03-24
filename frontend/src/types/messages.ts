export type ChannelMessage = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  attachments?: Array<{
    url: string;
    name?: string;
    mime?: string;
    size?: number;
  }>;

  status: "pending" | "sent" | "failed";
  tempId?: string;
  error?: string;
};
