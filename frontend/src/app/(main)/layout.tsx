import Providers from "@/components/utilities/providers";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <main className="min-h-screen bg-background">{children}</main>
    </Providers>
  );
}
