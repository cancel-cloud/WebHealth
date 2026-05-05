import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Outfit } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentProvider } from "@/components/cookie-consent";
import { GoogleConsentDefault } from "@/components/google-consent-default";
import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/components/cookie-consent.logic";
import { PosthogAnalytics } from "@/components/posthog-analytics";
import { VercelAnalytics } from "@/components/vercel-analytics";

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
    "Connect GSC + GA4, run a live crawl, and get a ranked fix list in 3 minutes. Live SEO snapshots for developers and freelancers.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev",
  ),
  openGraph: {
    type: "website",
    title: "Webhealth - GSC + GA4 data. Ranked fixes in 3 min.",
    description:
      "Connect GSC + GA4, run a live crawl, and get a ranked fix list with affected URLs and impact scores. Free to start.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev",
    siteName: "Webhealth",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Webhealth — Live SEO Snapshots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Webhealth - GSC + GA4 data. Ranked fixes in 3 min.",
    description:
      "Connect GSC + GA4, run a live crawl, and get a ranked fix list in 3 minutes. Free to start.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        var resolved = theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
        document.documentElement.style.colorScheme = resolved;
      } catch (error) {}
    })();
  `;

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
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <GoogleConsentDefault />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <GoogleAnalytics gaId={GOOGLE_ANALYTICS_MEASUREMENT_ID} />
        <VercelAnalytics />
        <CookieConsentProvider>
          <Suspense fallback={null}>
            <PosthogAnalytics
              projectKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
              captureHost={process.env.POSTHOG_CAPTURE_HOST ?? process.env.POSTHOG_HOST}
              uiHost={process.env.POSTHOG_UI_HOST}
            />
          </Suspense>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
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
