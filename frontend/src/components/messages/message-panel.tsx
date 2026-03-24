"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquarePlus, Paperclip, SendHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { ChannelMessage } from "@/types/messages";

type MessagePanelProps = {
  channelName: string;
  channelTopic?: string;
  messages: ChannelMessage[];
  isLoading?: boolean;
  className?: string;
  emptyStateHint?: string;
  onRetry?: () => void;
  onSend?: (payload: { content: string; authorName: string }) => void;
};

export function MessagePanel({
  channelName,
  channelTopic,
  messages,
  isLoading,
  className,
  emptyStateHint,
  onRetry,
  onSend,
}: MessagePanelProps) {
  const [draft, setDraft] = useState("");
  const { data: session, isPending } = authClient.useSession();
  const listRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const groupedMessages = useMemo(() => {
    return sortedMessages.map((message, index, array) => {
      const previous = array[index - 1];
      const next = array[index + 1];
      const isFirstFromSender = previous?.authorId !== message.authorId;
      const isLastFromSender = next?.authorId !== message.authorId;

      return {
        entry: message,
        isFirstFromSender,
        isLastFromSender,
      };
    });
  }, [sortedMessages]);
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [sortedMessages.length]);

  const handleSubmit = () => {
    if (!draft.trim()) return;
    const authorName = session?.user?.name?.trim() || "Unknown user";
    onSend?.({ content: draft.trim(), authorName });
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col rounded-xl border border-border/50 bg-background/95 shadow-md",
        className,
      )}
    >
      <div className="sticky top-0 z-10 bg-background/95">
        <Header channelName={channelName} channelTopic={channelTopic} />
        <Separator />
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading || isPending ? (
          <LoadingState />
        ) : sortedMessages.length === 0 ? (
          <EmptyState
            channelName={channelName}
            hint={emptyStateHint}
            onRetry={onRetry}
          />
        ) : (
          <ul className="space-y-1">
            {groupedMessages.map(
              ({ entry, isFirstFromSender, isLastFromSender }) => (
                <MessageRow
                  key={entry.id}
                  message={entry}
                  isOwn={session?.user?.id === entry.authorId}
                  isFirstFromSender={isFirstFromSender}
                  isLastFromSender={isLastFromSender}
                />
              ),
            )}
          </ul>
        )}
      </div>
      <div className="sticky bottom-0 z-10 bg-background/95">
        <Separator />
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          isDisabled={isLoading}
        />
      </div>
    </div>
  );
}

type HeaderProps = {
  channelName: string;
  channelTopic?: string;
};

function Header({ channelName, channelTopic }: HeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          <span className="text-primary">#</span>
          {channelName}
        </h2>
        {channelTopic ? (
          <p className="text-sm text-muted-foreground">{channelTopic}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Real-time updates and resource sharing for this channel.
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" className="gap-2">
        <MessageSquarePlus className="h-4 w-4" />
        New thread
      </Button>
    </header>
  );
}

type MessageRowProps = {
  message: ChannelMessage;
  isOwn: boolean;
  isFirstFromSender: boolean;
  isLastFromSender: boolean;
};

function MessageRow({
  message,
  isOwn,
  isFirstFromSender,
  isLastFromSender,
}: MessageRowProps) {
  const timestamp = useMemo(
    () =>
      new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.createdAt],
  );

  const fallback = useMemo(() => {
    const nameInitials = initialsFromName(message.authorName);
    return nameInitials ?? initialsFromId(message.authorId);
  }, [message.authorId, message.authorName]);

  return (
    <li className={cn("flex items-start gap-2", isOwn && "justify-end")}>
      {!isOwn && (
        <div className={cn("mt-1 w-8")}>
          {isLastFromSender ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[0.65rem] font-semibold uppercase">
                {fallback}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[80%] flex-col ",
          isOwn ? "items-end text-right" : "items-start text-left",
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!isOwn && isFirstFromSender && (
            <span className="font-semibold text-foreground">
              {message.authorName || formatAuthor(message.authorId)}
            </span>
          )}
        </div>
        <div
          className={cn(
            "relative whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed pr-14",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted/70 text-foreground",
          )}
        >
          <div className="flex items-end gap-2">
            <span className="mr-5" style={{ wordBreak: "break-word" }}>
              {message.content}
            </span>
            <span className="text-[0.75rem] text-muted-foreground/80 absolute right-3 bottom-2">
              {timestamp}
            </span>
          </div>
          {message.editedAt && (
            <span className="absolute top-1 right-3 text-[0.65rem] text-muted-foreground/80">
              Edited
            </span>
          )}
         
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div
            className={cn("mt-1 flex flex-wrap gap-2", isOwn && "justify-end")}
          >
            {message.attachments.map((attachment) => (
              <a
                key={attachment.url}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                  isOwn
                    ? "border-primary/60 bg-primary/20 text-primary-foreground hover:border-primary hover:bg-primary/40"
                    : "border-border/70 bg-muted/50 text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                <Paperclip className="h-3.5 w-3.5 group-hover:text-primary" />
                <span className="line-clamp-1">
                  {attachment.name ??
                    attachment.url.split("/").pop() ??
                    "Attachment"}
                </span>
              </a>
            ))}

            {message.status === "pending" && (
              <span className="text-xs text-muted-foreground">Sending…</span>
            )}
            {message.status === "failed" && (
              <span className="text-xs text-destructive">
                {message.error ?? "Failed to send. Click to retry."}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

type EmptyStateProps = {
  channelName: string;
  hint?: string;
  onRetry?: () => void;
};

function EmptyState({ channelName, hint, onRetry }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-border/60 bg-muted/30">
        <MessageSquarePlus className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Welcome to #{channelName}
        </h3>
        <p className="mx-auto max-w-sm text-sm">
          {hint ??
            "Kick things off with a message, share resources, or start a thread to collaborate."}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          Refresh
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <ul className="space-y-6">
      {[0, 1, 2].map((key) => (
        <li key={key} className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-12 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isDisabled?: boolean;
};

function Composer({ value, onChange, onSubmit, isDisabled }: ComposerProps) {
  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write a message..."
          rows={1}
          className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          disabled={isDisabled}
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={isDisabled || !value.trim()}
            onClick={onSubmit}
          >
            <SendHorizontal className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function initialsFromId(authorId: string): string {
  if (!authorId) return "?";
  const cleaned = authorId.replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "?";
  return cleaned.slice(0, 2).toUpperCase();
}

function formatAuthor(authorId: string): string {
  if (!authorId) return "Anonymous";
  if (authorId.includes("@")) {
    return authorId.split("@")[0];
  }
  return authorId;
}

function initialsFromName(name?: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const initials = parts
    .map((part) => part[0])
    .join("")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  return initials || null;
}
