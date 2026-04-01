import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";

export default function ServerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <SidebarTrigger className="lg:hidden" />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
