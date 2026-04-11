"use client";

import { Bell, BellOff, BellRing, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type NotificationLevel,
  useChannelNotificationPreference,
  useUpdateChannelNotificationPreference,
} from "@/hooks/notifications/useChannelNotificationPreference";
import { cn } from "@/lib/utils";

type ChannelNotificationSettingsProps = {
  channelId?: string;
  className?: string;
};

type LevelMeta = {
  value: NotificationLevel;
  label: string;
  description: string;
  icon: typeof Bell;
};

const LEVELS: LevelMeta[] = [
  {
    value: "all",
    label: "All messages",
    description: "Default — notify for every new message in this channel.",
    icon: BellRing,
  },
  {
    value: "mentions",
    label: "Only @mentions",
    description: "Only notify when you are mentioned.",
    icon: Bell,
  },
  {
    value: "none",
    label: "Muted",
    description: "No notifications, even @mentions.",
    icon: BellOff,
  },
];

export function ChannelNotificationSettings({
  channelId,
  className,
}: ChannelNotificationSettingsProps) {
  const { data, isLoading } = useChannelNotificationPreference(channelId);
  const { mutate, isPending } = useUpdateChannelNotificationPreference(channelId);

  const currentLevel: NotificationLevel = data?.level ?? "all";
  const current = LEVELS.find((lvl) => lvl.value === currentLevel) ?? LEVELS[0];
  const TriggerIcon = current.icon;
  const disabled = !channelId || isLoading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("shrink-0 gap-1.5 text-xs", className)}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <TriggerIcon className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Notifications for this channel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LEVELS.map((level) => {
          const Icon = level.icon;
          const isActive = level.value === currentLevel;
          return (
            <DropdownMenuItem
              key={level.value}
              onSelect={(event) => {
                event.preventDefault();
                if (isActive || !channelId) return;
                mutate(level.value);
              }}
              className="flex items-start gap-2 py-2"
            >
              <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium leading-none">
                  {level.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {level.description}
                </p>
              </div>
              {isActive ? (
                <Check className="mt-1 h-3.5 w-3.5 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
