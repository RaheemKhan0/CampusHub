"use client";

import { useEffect, useMemo } from "react";

import { getSocket } from "@/lib/socket";
import { Namespaces } from "@/types/constants";

export const useSocket = (namespace: Namespaces = "/messages") => {
  const socket = useMemo(() => getSocket(namespace), [namespace]);

  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }
  }, [socket]);

  return socket;
};
