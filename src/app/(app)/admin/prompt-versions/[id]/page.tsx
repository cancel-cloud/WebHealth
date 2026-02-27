import { headers } from "next/headers";
import Link from "next/link";
import { VersionForm } from "./version-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PromptVersionPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

  let version = null;
  if (!isNew) {
    const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/admin/prompt-versions`, {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
      cache: "no-store",
    });
    const data = await res.json();
    const versions = data.versions ?? [];
    version = versions.find((v: { id: string }) => v.id === id) ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/prompt-versions" className="hover:underline">
            Prompt Versions
          </Link>
          <span>/</span>
          <span>{isNew ? "New Version" : (version?.name ?? id)}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? "New Prompt Version" : "Edit Prompt Version"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isNew
            ? "Create a new prompt template. It will be inactive by default."
            : "Edit this prompt template. Use Set as Active to make it the live prompt."}
        </p>
      </div>
      <VersionForm initialVersion={version} />
    </div>
  );
}
