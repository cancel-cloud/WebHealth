import { DemoPageContent, buildDemoMetadata } from "./demo-page";

export const metadata = buildDemoMetadata("en");

export default function DemoPage() {
  return <DemoPageContent language="en" />;
}
