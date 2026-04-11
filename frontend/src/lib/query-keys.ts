export const queryKeys = {
  notifications: {
    unread: ["notifications", "unread"] as const,
    channelPreference: (channelId: string) =>
      ["notifications", "preferences", "channel", channelId] as const,
  },
} as const;
