import type { components } from '@/types/openapi';

export type MessageViewDto = components['schemas']['MessageViewDto'];

export type MessageAck =
  | { success: true; message: MessageViewDto }
  | { success: false; error: { message: string; code?: string } };

