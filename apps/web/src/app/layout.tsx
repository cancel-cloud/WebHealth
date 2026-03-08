import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebAudit | SEO & Analytics Monitoring",
  description: "Connect GSC + GA4, run a live crawl, and get an AI-ranked fix list in 3 minutes. Automated SEO reporting for developers and freelancers.",
  metadataBase: new URL("https://webaudit-79.localcan.dev"),
  openGraph: {
    type: "website",
    title: "WebAudit — GSC + GA4 data. Ranked fixes in 3 min.",
    description: "Connect GSC + GA4, run a live crawl, and get an AI-ranked fix list with affected URLs and impact scores. Free to start.",
    url: "https://webaudit-79.localcan.dev",
    siteName: "WebAudit",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WebAudit — Automated SEO Reporting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WebAudit — GSC + GA4 data. Ranked fixes in 3 min.",
    description: "Connect GSC + GA4, run a live crawl, and get an AI-ranked fix list in 3 minutes. Free to start.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafafa" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a1f2e" />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
