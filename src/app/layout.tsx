import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { PwaInstallPrompt } from "@/presentation/components/pwa/PwaInstallPrompt";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KYBERLIFE",
  description: "Personal Web Platform",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/logo-kyber-blue-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo-kyber-blue-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo-kyber-blue-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KyberLife",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // App-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased text-sm font-normal`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <PwaInstallPrompt />
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
