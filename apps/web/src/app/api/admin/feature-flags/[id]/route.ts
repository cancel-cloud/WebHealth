import { NextResponse } from "next/server";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { featureFlags } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { enabledGlobally } = body;

    if (typeof enabledGlobally !== "boolean") {
      return NextResponse.json({ error: "enabledGlobally must be a boolean" }, { status: 400 });
    }

    const [updated] = await db
      .update(featureFlags)
      .set({ enabledGlobally, updatedAt: new Date() })
      .where(eq(featureFlags.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    return NextResponse.json({ flag: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error updating feature flag:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
