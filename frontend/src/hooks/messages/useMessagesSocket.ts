"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/types/constants";
import { MessageAck } from "@/types/socket";

import type { components } from "@/types/openapi";

type MessageViewDto = components["schemas"]["MessageViewDto"];
type CreateMessageDto = components["schemas"]["CreateMessageDto"];

type UseMessagesSocketOptions = {
  serverId?: string;
  channelId?: string;
  onMessage?: (
    message: MessageViewDto,
  ) => void;
  onConnected?: (socketId: string | undefined) => void;
  onDisconnected?: (reason: string) => void;
};

type SendMessageInput = Omit<CreateMessageDto, "channelId">;

type UseMessagesSocketReturn = {
  socket: ReturnType<typeof useSocket>;
  isConnected: boolean;
  sendMessage: (input: SendMessageInput , ack ?: (resp : MessageAck) => void) => void;
};
type SendMessageAckHandler = (ack: MessageAck) => void;

export const useMessagesSocket = ({
  serverId,
  channelId,
  onMessage,
  onConnected,
  onDisconnected,
}: UseMessagesSocketOptions): UseMessagesSocketReturn => {
  const socket = useSocket("/messages");

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => onConnected?.(socket.id);
    const handleDisconnect = (reason: string) => onDisconnected?.(reason);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, onConnected, onDisconnected]);

  useEffect(() => {
    if (!socket || !serverId || !channelId) return;

    const payload = { serverId, channelId };
    socket.emit(SOCKET_EVENTS.CHANNEL_JOIN, payload);

    const handleMessage = (
      message: MessageViewDto,
    ) => {
      onMessage?.(message);
    };

    socket.on(SOCKET_EVENTS.MESSAGE_CREATED, handleMessage);

    return () => {
      socket.emit(SOCKET_EVENTS.CHANNEL_LEAVE, payload);
      socket.off(SOCKET_EVENTS.MESSAGE_CREATED, handleMessage);
    };
  }, [socket, serverId, channelId, onMessage]);

  const sendMessage = useCallback(
    (input: SendMessageInput, ack?: SendMessageAckHandler) => {
      if (!socket || !serverId || !channelId) return;

      socket.emit(
        SOCKET_EVENTS.MESSAGE_CREATE,
        {
          ...input,
          serverId,
          channelId,
        },
        (response : MessageAck) => ack?.(response),
      );
    },
    [socket, serverId, channelId],
  );

  return useMemo(
    () => ({
      socket,
      isConnected: Boolean(socket?.connected),
      sendMessage,
    }),
    [socket, sendMessage],
  );
};
