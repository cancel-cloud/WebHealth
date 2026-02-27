import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PromptVersion = {
  id: string;
  name: string;
  schemaVersion: string;
  isActive: boolean;
  createdAt: string;
};

export default async function AdminPromptVersionsPage() {
  const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/admin/prompt-versions`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  });
  const data = await res.json();
  const versions: PromptVersion[] = data.versions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompt Versions</h1>
          <p className="text-muted-foreground text-sm">
            Manage AI report prompt templates. Only one version can be active at a time.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/prompt-versions/new">New Version</Link>
        </Button>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prompt versions yet.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Schema Version</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/prompt-versions/${v.id}`}
                      className="font-medium hover:underline"
                    >
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.schemaVersion}</td>
                  <td className="px-4 py-3">
                    {v.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
