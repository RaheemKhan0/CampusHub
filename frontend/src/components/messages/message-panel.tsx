"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hash, MessageSquarePlus, Paperclip, SendHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { ChannelMessage } from "@/types/messages";

// Consistent per-author avatar colour derived from their id/name
const AVATAR_PALETTE = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
];

function avatarColor(str: string): string {
  if (!str) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

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
      return { entry: message, isFirstFromSender, isLastFromSender };
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
        "flex h-screen w-full flex-1 flex-col overflow-hidden bg-background",
        className,
      )}
    >
      {/* Channel header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <Header channelName={channelName} channelTopic={channelTopic} />
        <Separator />
      </div>

      {/* Message list */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {isLoading || isPending ? (
          <LoadingState />
        ) : sortedMessages.length === 0 ? (
          <EmptyState
            channelName={channelName}
            hint={emptyStateHint}
            onRetry={onRetry}
          />
        ) : (
          <ul className="space-y-0.5">
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

      {/* Composer */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm">
        <Separator />
        <Composer
          value={draft}
          channelName={channelName}
          onChange={setDraft}
          onSubmit={handleSubmit}
          isDisabled={isLoading}
        />
      </div>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

type HeaderProps = {
  channelName: string;
  channelTopic?: string;
};

function Header({ channelName, channelTopic }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Hash className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {channelName}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {channelTopic ?? "Real-time updates and resources for this channel."}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs">
        <MessageSquarePlus className="h-3.5 w-3.5" />
        New thread
      </Button>
    </header>
  );
}

// ─── Message row ─────────────────────────────────────────────────────────────

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

  const colorClass = useMemo(
    () => avatarColor(message.authorId || message.authorName),
    [message.authorId, message.authorName],
  );

  return (
    <li
      className={cn(
        "flex items-end gap-2",
        isOwn ? "justify-end" : "justify-start",
        isFirstFromSender ? "mt-3" : "mt-0.5",
      )}
    >
      {/* Avatar slot — always reserves space for alignment */}
      {!isOwn && (
        <div className="w-8 shrink-0">
          {isLastFromSender ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className={cn(
                  "text-[0.6rem] font-bold text-white",
                  colorClass,
                )}
              >
                {fallback}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-0.5",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name — only on first message of a group */}
        {!isOwn && isFirstFromSender && (
          <span className="ml-1 text-xs font-semibold text-foreground/80">
            {message.authorName || formatAuthor(message.authorId)}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted/70 text-foreground",
            message.status === "pending" && "opacity-60",
            message.status === "failed" && "border border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {/* Message content with right padding for timestamp */}
          <span
            className="mr-12 block"
            style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
          >
            {message.content}
          </span>

          {/* Inline timestamp */}
          <span
            className={cn(
              "absolute bottom-1.5 right-3 text-[0.65rem] leading-none",
              isOwn
                ? "text-primary-foreground/60"
                : "text-muted-foreground/60",
            )}
          >
            {message.status === "pending"
              ? "Sending…"
              : message.status === "failed"
                ? "Failed"
                : timestamp}
          </span>

          {/* Edited badge */}
          {message.editedAt && (
            <span
              className={cn(
                "absolute right-3 top-1.5 text-[0.6rem] leading-none",
                isOwn ? "text-primary-foreground/50" : "text-muted-foreground/50",
              )}
            >
              edited
            </span>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5 px-1", isOwn && "justify-end")}>
            {message.attachments.map((attachment) => (
              <a
                key={attachment.url}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                  isOwn
                    ? "border-primary/40 bg-primary/20 text-primary-foreground hover:bg-primary/40"
                    : "border-border/60 bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
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
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

type EmptyStateProps = {
  channelName: string;
  hint?: string;
  onRetry?: () => void;
};

function EmptyState({ channelName, hint, onRetry }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
        <Hash className="h-7 w-7 text-primary/50" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">
          Welcome to #{channelName}
        </h3>
        <p className="mx-auto max-w-xs text-sm leading-relaxed">
          {hint ??
            "This is the beginning of the conversation. Send a message to get started."}
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

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <ul className="space-y-5">
      {[0, 1, 2].map((key) => (
        <li key={key} className="flex items-end gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
          </div>
        </li>
      ))}
      <li className="flex items-end justify-end gap-3">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </li>
      <li className="flex items-end gap-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-14 w-64 rounded-2xl" />
      </li>
    </ul>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

type ComposerProps = {
  value: string;
  channelName: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isDisabled?: boolean;
};

function Composer({ value, channelName, onChange, onSubmit, isDisabled }: ComposerProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim()) onSubmit();
    }
  };

  return (
    <div className="px-4 py-3">
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border bg-muted/20 px-3.5 py-2.5 transition-all",
          "border-border/60 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10",
        )}
      >
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}…`}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
          disabled={isDisabled}
        />
        <Button
          type="button"
          size="icon"
          className={cn(
            "h-7 w-7 shrink-0 transition-all",
            value.trim()
              ? "opacity-100"
              : "opacity-40",
          )}
          disabled={isDisabled || !value.trim()}
          onClick={onSubmit}
        >
          <SendHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[0.65rem] text-muted-foreground/40">
        Press <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-mono text-[0.6rem]">Enter</kbd> to send
        {" · "}
        <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-mono text-[0.6rem]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initialsFromId(authorId: string): string {
  if (!authorId) return "?";
  const cleaned = authorId.replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "?";
  return cleaned.slice(0, 2).toUpperCase();
}

function formatAuthor(authorId: string): string {
  if (!authorId) return "Anonymous";
  if (authorId.includes("@")) return authorId.split("@")[0];
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
