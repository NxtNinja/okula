import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/provider/ConvexClientProvider";
import { ThemeProvider } from "@/components/ui/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const dm_mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Okula",
  description: "Chat with your friends, create groups, and more!",
  openGraph: {
    title: "Okula - Chat with your friends, create groups, and more!",
    description:
      "Chat with your friends, create groups, and more! With Okula, you can easily connect with your friends, create groups, and more!",
    url: "https://okula.netlify.app/",
    siteName: "Celvo",
    images: [
      {
        url: "https://okula.netlify.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Okula - Chat with your friends, create groups, and more!",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://okula.netlify.app/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dm_mono.className} antialiased h-screen overflow-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
