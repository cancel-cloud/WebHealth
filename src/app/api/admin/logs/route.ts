import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { systemLogs, user } from "@/db/schema";
import { eq, and, gte, lte, desc, or, ilike, inArray } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userEmail = searchParams.get("userEmail");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

    const conditions = [];
    if (action) conditions.push(eq(systemLogs.action, action));
    if (status) conditions.push(eq(systemLogs.status, status));
    if (from) conditions.push(gte(systemLogs.createdAt, new Date(from)));
    if (to) conditions.push(lte(systemLogs.createdAt, new Date(to)));

    // If userEmail filter: find matching user IDs first, then filter logs
    if (userEmail && userEmail.trim()) {
      const matchingUsers = await db
        .select({ id: user.id })
        .from(user)
        .where(ilike(user.email, `%${userEmail.trim()}%`));
      const ids = matchingUsers.map((u) => u.id);
      if (ids.length === 0) {
        return NextResponse.json({ logs: [] });
      }
      conditions.push(
        or(
          inArray(systemLogs.triggeredBy, ids),
          inArray(systemLogs.targetUserId, ids),
        ),
      );
    }

    const triggeredByUser = db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .as("triggeredByUser");

    const targetUser = db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .as("targetUser");

    const logs = await db
      .select({
        id: systemLogs.id,
        action: systemLogs.action,
        status: systemLogs.status,
        details: systemLogs.details,
        createdAt: systemLogs.createdAt,
        triggeredByUserId: systemLogs.triggeredBy,
        targetUserId: systemLogs.targetUserId,
        triggeredByName: triggeredByUser.name,
        triggeredByEmail: triggeredByUser.email,
        targetUserName: targetUser.name,
        targetUserEmail: targetUser.email,
      })
      .from(systemLogs)
      .leftJoin(triggeredByUser, eq(triggeredByUser.id, systemLogs.triggeredBy))
      .leftJoin(targetUser, eq(targetUser.id, systemLogs.targetUserId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching admin logs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
