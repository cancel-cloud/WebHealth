import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAgencyRootRedirectPath } from "./agency-seo.logic";

export default async function HomePage() {
  const headerStore = await headers();
  redirect(getAgencyRootRedirectPath(headerStore.get("accept-language")));
}
