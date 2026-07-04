import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaSetup } from "@/components/PwaSetup";

export const metadata: Metadata = {
  title: "Score Tracker",
  description: "Offline-first board game score tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scores",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale 1 stops iOS auto-zoom when focusing score inputs.
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#101014",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PwaSetup />
        {children}
      </body>
    </html>
  );
}
