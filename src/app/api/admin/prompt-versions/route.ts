import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiReportPromptVersions } from "@/db/schema";

const ADMIN_EMAIL = "lukas@devbrew.dev";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const versions = await db.query.aiReportPromptVersions.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return NextResponse.json({ versions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const body = await request.json();
    const { name, template, examples, schemaVersion } = body;

    if (!name || !template) {
      return NextResponse.json({ error: "name and template are required" }, { status: 400 });
    }

    const version = await db.insert(aiReportPromptVersions).values({
      id: nanoid(),
      name,
      template,
      examples: examples ?? null,
      schemaVersion: schemaVersion ?? "v2",
      isActive: false,
    }).returning();

    return NextResponse.json({ version: version[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const body = await request.json();
    const { id, isActive, name, template, examples } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // If setting active, deactivate all others first
    if (isActive === true) {
      await db.update(aiReportPromptVersions)
        .set({ isActive: false })
        .where(eq(aiReportPromptVersions.isActive, true));
    }

    const updated = await db.update(aiReportPromptVersions)
      .set({
        ...(name !== undefined && { name }),
        ...(template !== undefined && { template }),
        ...(examples !== undefined && { examples }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(eq(aiReportPromptVersions.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({ version: updated[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
