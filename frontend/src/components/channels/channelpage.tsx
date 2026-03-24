"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ChannelPageSkeleton } from "./channelskeleton";
import { MessagePanel } from "@/components/messages/message-panel";
import { ChannelMessage } from "@/types/messages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChannel } from "@/hooks/channels/useChannel";
import { useState } from "react";
import { useMessages } from "@/hooks/messages/useMessages";
import type { components } from "@/types/openapi";
import { useMessagesSocket } from "@/hooks/messages/useMessagesSocket";
import { authClient } from "@/lib/auth-client";
import { MessageAck } from "@/types/socket";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/tanstack/queryKeys";
import { MessagesInfiniteData } from "@/hooks/messages/useMessages";

type Attachment = NonNullable<ChannelMessage["attachments"]>[number];
type PendingMessage = ChannelMessage & {};
export default function ChannelPage() {
  const params = useParams<{ serverId: string; channelId: string }>();
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const queryClient = useQueryClient();

  const serverId = Array.isArray(params?.serverId)
    ? params?.serverId[0]
    : params?.serverId;
  const channelId = Array.isArray(params?.channelId)
    ? params?.channelId[0]
    : params?.channelId;

  const { data: session } = authClient.useSession();

  const handleIncomingMessage = (
    message: components["schemas"]["MessageViewDto"],
  ) => {
    if (!serverId || !channelId) return;

    // Drop any optimistic entry that matches the real message id
    setPendingMessages((prev) =>
      prev.filter((pending) => pending.id !== message.id && pending.tempId !== message.id),
    );

    queryClient.setQueryData(
      qk.messagesInfinite(serverId, channelId, 40), // same key you use in useMessages
      (prev: MessagesInfiniteData) => {
        if (!prev) return prev;
        const [firstPage, ...rest] = prev.pages;

        const alreadyExists = firstPage.items?.some(
          (item) => item && "id" in item && (item as { id?: string }).id === message.id,
        );

        if (alreadyExists) {
          return prev;
        }

        const baseItems = Array.isArray(firstPage.items) ? firstPage.items : [];
        const mergedFirstPage = {
          ...firstPage,
          items: [...baseItems, message],
          total: firstPage.total + 1,
        };

        return {
          pageParams: prev.pageParams,
          pages: [mergedFirstPage, ...rest],
        };
      },
    );
  };
  const { sendMessage } = useMessagesSocket({
    serverId,
    channelId,
    onConnected: (id) => console.log("connected:", id),
    onDisconnected: (reason) => console.log("disconnected:", reason),
    onMessage: handleIncomingMessage,
  });

  const handleSend = ({
    content,
    authorName,
  }: {
    content: string;
    authorName: string;
  }) => {
    if (!serverId || !channelId) return;

    const tempId = crypto.randomUUID();
    const fallbackAuthor = authorName || session?.user?.name || "Unknown user";
    const now = new Date().toISOString();

    setPendingMessages((prev) => [
      ...prev,
      {
        tempId,
        id: tempId,
        authorId: session?.user?.id ?? "temp",
        authorName: fallbackAuthor,
        content,
        createdAt: now,
        updatedAt: now,
        status: "pending",
      },
    ]);

    sendMessage({ content, authorName: fallbackAuthor }, (ack: MessageAck) => {
      setPendingMessages((prev) =>
        prev.flatMap((message) => {
          if (message.tempId !== tempId) return message;
          if (!ack.success) {
            return {
              ...message,
              status: "failed",
              error: ack.error?.message ?? "Failed to send.",
            };
          }
          return []; // remove; the real message will arrive via message:created broadcast
        }),
      );

      if (ack.success && ack.message) {
        queryClient.setQueryData(
          qk.messagesInfinite(serverId, channelId, 40),
          (prev: MessagesInfiniteData | undefined) => {
            if (!prev) return prev;
            const [firstPage, ...rest] = prev.pages;
            const exists = firstPage.items?.some(
              (item) => item && "id" in item && (item as { id?: string }).id === ack.message?.id,
            );
            if (exists) return prev;
            const baseItems = Array.isArray(firstPage.items) ? firstPage.items : [];
            const mergedFirstPage = {
              ...firstPage,
              items: [...baseItems, ack.message],
              total: firstPage.total + 1,
            };
            return {
              pageParams: prev.pageParams,
              pages: [mergedFirstPage, ...rest],
            };
          },
        );
      }
    });
  };
  const channelQuery = useChannel(serverId, channelId);
  const messagesQuery = useMessages(serverId, channelId, { pageSize: 40 });

  const optimisticMessages = useMemo<ChannelMessage[]>(() => {
    const baseMessages = messagesQuery.data
      ? messagesQuery.data.pages
        .reduce<components["schemas"]["MessageViewDto"][]>((acc, page) => {
          const items = page.items as unknown as
            | components["schemas"]["MessageViewDto"][]
            | undefined;
          if (items) {
            acc.push(...items);
          }
          return acc;
        }, [])
        .map(mapToChannelMessage)
      : [];
    return [...baseMessages, ...pendingMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messagesQuery.data, pendingMessages]);

  const isLoading = channelQuery.isLoading || messagesQuery.isLoading;
  const isError = channelQuery.isError || messagesQuery.isError;

  if (!serverId || !channelId) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">
          Select a channel from the sidebar to start reading messages.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ChannelPageSkeleton />;
  }

  if (isError || !channelQuery.data) {
    return (
      <ErrorState
        message={
          channelQuery.error?.message ??
          messagesQuery.error?.message ??
          "We couldn't load this channel."
        }
        onRetry={() => {
          void channelQuery.refetch();
          void messagesQuery.refetch();
        }}
        isLoading={messagesQuery.isFetching || channelQuery.isFetching}
      />
    );
  }

  return (
    <MessagePanel
      channelName={channelQuery.data.name}
      channelTopic={channelQuery.data.name}
      messages={optimisticMessages}
      isLoading={messagesQuery.isFetchingNextPage}
      emptyStateHint={`No messages yet in #${channelQuery.data.name}. Start the conversation!`}
      onRetry={() => void messagesQuery.refetch()}
      onSend={handleSend}
    />
  );
}

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  isLoading?: boolean;
};

function ErrorState({ message, onRetry, isLoading }: ErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md space-y-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-destructive/90">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isLoading}
            className={cn("gap-2", isLoading && "opacity-70")}
          >
            {isLoading ? "Retrying…" : "Try again"}
          </Button>
        )}
      </div>
    </div>
  );
}
const normalizeAttachments = (value: unknown): Attachment[] => {
  if (!Array.isArray(value)) return [];

  return (value as unknown[]).reduce<Attachment[]>((acc, attachment) => {
    if (!attachment || typeof attachment !== "object") return acc;

    const { url, name, mime, size } = attachment as Partial<Attachment>;
    if (!url) return acc;

    acc.push({ url, name, mime, size });
    return acc;
  }, []);
};

const mapToChannelMessage = (
  message: components["schemas"]["MessageViewDto"],
): ChannelMessage => {
  return {
    id: message.id,
    authorId: message.authorId,
    authorName: message.authorName ?? "",
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    editedAt: message.editedAt,
    attachments: normalizeAttachments(message?.attachments),
    status: "sent",
  };
};
