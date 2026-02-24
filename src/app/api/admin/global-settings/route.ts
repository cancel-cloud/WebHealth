import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { planSettings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const settings = await db
      .select()
      .from(planSettings)
      .orderBy(asc(planSettings.tier));

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json() as {
      tier: string;
      reportsPerMonth: number | null;
      maxProperties: number | null;
    };

    if (!body.tier) {
      return NextResponse.json({ error: "tier is required" }, { status: 400 });
    }

    await db
      .update(planSettings)
      .set({
        reportsPerMonth: body.reportsPerMonth ?? null,
        maxProperties: body.maxProperties ?? null,
        updatedAt: new Date(),
      })
      .where(eq(planSettings.tier, body.tier));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
