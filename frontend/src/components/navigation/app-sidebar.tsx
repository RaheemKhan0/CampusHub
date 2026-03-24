"use client";

import { useCallback, useState } from "react";
import type { components } from "@/types/openapi";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ModeToggle } from "../utilities/modeToggle";
import { ChatSwitcher } from "./dropdowns/chat-switcher";
import { UniversityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServerAccordion } from "./accordions/server-accordion";
import { Separator } from "@/components/ui/separator";
import { ServerChannelsPanel } from "./server-channels-panel";
import { useRouter } from "next/navigation";

type ServerView = components["schemas"]["ServerViewDto"];
type SelectedServer = Pick<ServerView, "id" | "name">;

const CHAT_ITEMS = [
  {
    name: "University Modules",
    logo: UniversityIcon,
    plan: "City University",
  },
];

export function AppSidebar() {
  const [selectedServer, setSelectedServer] = useState<SelectedServer | null>(
    null,
  );
  const router = useRouter();
  const [isChannelPanelOpen, setIsChannelPanelOpen] = useState(false);

  const handleServerSelect = useCallback(
    (server: ServerView) => {
      setSelectedServer({ id: server.id, name: server.name });
      setIsChannelPanelOpen(true);
      router.push(`/dashboard/server/${server.id}`);
    },
    [router],
  );

  const handlePanelClose = useCallback(() => {
    setIsChannelPanelOpen(false);
  }, []);

  const panelOpen = isChannelPanelOpen && Boolean(selectedServer?.id);

  return (
    <div className="relative flex h-full min-h-screen">
      <Sidebar className={cn("flex-shrink-0 dark:bg-[#121212]")}>
        <SidebarHeader>
          <ChatSwitcher Chat={CHAT_ITEMS} />
        </SidebarHeader>
        <SidebarContent className="flex flex-col">
          <SidebarGroup className="flex-1 overflow-x-hidden px-0">
            <ServerAccordion
              className="mx-3"
              activeServerId={selectedServer?.id ?? null}
              onServerSelect={handleServerSelect}
            />
            <Separator className="mx-3 my-4" />
            <div className="flex flex-1 flex-col gap-4 px-4 pb-4 text-sm text-muted-foreground">
              <div className="rounded-md border border-border/40 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                  Coming soon
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Personalised profile details and quick actions will live here.
                </p>
              </div>
              <div className="rounded-md border border-border/40 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                  Tips
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Switch between servers using the accordion above. Scroll to load more.
                </p>
              </div>
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className={cn("flex w-full flex-row items-center justify-center")}>
            <ModeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <ServerChannelsPanel
        open={panelOpen}
        onClose={handlePanelClose}
        serverId={selectedServer?.id}
        serverName={selectedServer?.name}
      />
    </div>
  );
}
