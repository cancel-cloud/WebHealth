import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentProvider } from "@/components/cookie-consent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Webhealth | SEO & Analytics Monitoring",
  description:
    "Connect GSC + GA4, run a live crawl, and get an AI-ranked fix list in 3 minutes. Automated SEO reporting for developers and freelancers.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev",
  ),
  openGraph: {
    type: "website",
    title: "Webhealth - GSC + GA4 data. Ranked fixes in 3 min.",
    description:
      "Connect GSC + GA4, run a live crawl, and get an AI-ranked fix list with affected URLs and impact scores. Free to start.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev",
    siteName: "Webhealth",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Webhealth — Automated SEO Reporting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Webhealth - GSC + GA4 data. Ranked fixes in 3 min.",
    description:
      "Connect GSC + GA4, run a live crawl, and get an AI-ranked fix list in 3 minutes. Free to start.",
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
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fafafa"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#1a1f2e"
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <CookieConsentProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
