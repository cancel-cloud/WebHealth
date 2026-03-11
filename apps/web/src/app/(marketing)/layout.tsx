import Link from "next/link";
import { Navbar } from "@/components/navbar";

function MarketingFooter() {
  return (
    <footer
      className="border-t py-8 px-6"
      style={{
        borderColor: "oklch(0.91 0.01 250)",
        backgroundColor: "oklch(0.975 0.003 250)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className="font-display font-bold text-sm"
            style={{ color: "oklch(0.12 0.01 250)" }}
          >
            Webhealth
          </span>
          <span className="text-xs" style={{ color: "oklch(0.62 0.02 250)" }}>
            &copy; {new Date().getFullYear()} DevBrew. All rights reserved.
          </span>
        </div>
        <nav className="flex items-center gap-5" aria-label="Footer navigation">
          <Link
            href="/privacy"
            className="text-xs hover:underline transition-colors"
            style={{ color: "oklch(0.55 0.02 250)" }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs hover:underline transition-colors"
            style={{ color: "oklch(0.55 0.02 250)" }}
          >
            Terms of Service
          </Link>
          <a
            href="mailto:contact@devbrew.dev"
            className="text-xs hover:underline transition-colors"
            style={{ color: "oklch(0.55 0.02 250)" }}
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <MarketingFooter />
    </>
  );
}
