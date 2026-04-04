"use client";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  notification$,
  startNotificationStream,
  stopNotificationStream,
} from "@/lib/notification-stream";
import { toast } from "sonner";

type HttpErrorLike = { status?: number };

const isHttpError = (value: unknown): value is HttpErrorLike =>
  typeof value === "object" && value !== null && "status" in value;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, err: unknown) => {
        if (failureCount >= 2) return false;
        const status = isHttpError(err) ? (err.status ?? 0) : 0;
        return status >= 500;
      }, // retry only server errors
    },
    mutations: {
      networkMode: "online",
      retry: 0,
    },
  },
});
const Providers = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const subscription = notification$.subscribe((event) => {
      console.log(" [providers] recieved notification : ", event);
      if (event.type === "message.create") {
        toast(
          event.data.authorName
            ? `${event.data.authorName} sent a message`
            : "New message",
          {
            description: event.data.channelId,
          },
        );
      }
    });

    startNotificationStream();

    return () => {
      console.log('unsubscribing the notification stream');
      subscription.unsubscribe();
      stopNotificationStream();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
        position="bottom"
      />
    </QueryClientProvider>
  );
};

export default Providers;
