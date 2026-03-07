import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal financial tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SessionProvider session={session}>
          <div className="flex h-screen overflow-hidden bg-background">
            {session && <Sidebar />}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
          <Toaster
            richColors
            position="top-center"
            duration={4000}
            closeButton
            toastOptions={{
              style: {
                fontSize: "14px",
                padding: "14px 18px",
                minWidth: "320px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              },
            }}
          />
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
