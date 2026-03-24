import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import Providers from "@/components/utilities/providers";


export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Providers>
        <AppSidebar />
        <main className="flex-1">
          <SidebarTrigger className="lg:hidden" />
          {children}
        </main>
      </Providers>
    </SidebarProvider>
  );
}
