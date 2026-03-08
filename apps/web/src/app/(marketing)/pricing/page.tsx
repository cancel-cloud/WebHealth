import type { Metadata } from "next";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "Pricing — WebAudit",
  description: "Simple, transparent pricing. Free to start — no credit card required.",
};

export default function PricingPage() {
  return (
    <div className="py-20">
      <PricingSection />
    </div>
  );
}
