import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="size-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ backgroundColor: "#6366f110", border: "1px solid #6366f120" }}
      >
        <span className="font-display text-3xl font-extrabold" style={{ color: "#6366f1" }}>
          404
        </span>
      </div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-3">
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        This page doesn&apos;t exist or has been moved. Head back to the dashboard to continue.
      </p>
      <div className="flex gap-3">
        <Button asChild className="rounded-full px-6">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
