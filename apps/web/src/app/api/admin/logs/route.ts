import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { productEvents, systemLogs, user } from "@webhealth/shared/db/schema";
import { eq, and, gte, lte, desc, or, ilike, inArray } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import {
  buildProductEventDetails,
  normalizeLogDetails,
  normalizeProductEventStatus,
  sortAndLimitActivityLogs,
} from "./route.logic";

const LOG_PRODUCT_EVENT_ACTIONS = [
  "refresh_started",
  "refresh_completed",
  "refresh_failed",
  "ai_run_queued",
  "ai_run_started",
  "ai_run_completed",
  "ai_run_failed",
  "action_state_changed",
  "snapshot_captured",
  "snapshot_copied",
  "snapshot_opened",
  "snapshot_share_created",
] as const;

export async function GET(req: Request) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userEmail = searchParams.get("userEmail");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

    const systemConditions = [];
    const productEventConditions = [];
    if (action) {
      systemConditions.push(eq(systemLogs.action, action));
      productEventConditions.push(eq(productEvents.name, action));
    } else {
      productEventConditions.push(inArray(productEvents.name, [...LOG_PRODUCT_EVENT_ACTIONS]));
    }
    if (status) systemConditions.push(eq(systemLogs.status, status));
    if (from) {
      const fromDate = new Date(from);
      systemConditions.push(gte(systemLogs.createdAt, fromDate));
      productEventConditions.push(gte(productEvents.createdAt, fromDate));
    }
    if (to) {
      const toDate = new Date(to);
      systemConditions.push(lte(systemLogs.createdAt, toDate));
      productEventConditions.push(lte(productEvents.createdAt, toDate));
    }

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
      systemConditions.push(
        or(
          inArray(systemLogs.triggeredBy, ids),
          inArray(systemLogs.targetUserId, ids),
        ),
      );
      productEventConditions.push(inArray(productEvents.userId, ids));
    }

    const triggeredByUser = db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .as("triggeredByUser");

    const targetUser = db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .as("targetUser");

    const systemActivityRows = await db
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
      .where(systemConditions.length > 0 ? and(...systemConditions) : undefined)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit);

    const systemActivity = systemActivityRows.map((log) => ({
      ...log,
      details: normalizeLogDetails(log.details),
    }));

    const productEventUser = db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .as("productEventUser");

    const productActivityRows = await db
      .select({
        id: productEvents.id,
        action: productEvents.name,
        source: productEvents.source,
        entityType: productEvents.entityType,
        entityId: productEvents.entityId,
        details: productEvents.properties,
        createdAt: productEvents.createdAt,
        triggeredByUserId: productEvents.userId,
        triggeredByName: productEventUser.name,
        triggeredByEmail: productEventUser.email,
      })
      .from(productEvents)
      .leftJoin(productEventUser, eq(productEventUser.id, productEvents.userId))
      .where(productEventConditions.length > 0 ? and(...productEventConditions) : undefined)
      .orderBy(desc(productEvents.createdAt))
      .limit(limit);

    const productActivity = productActivityRows
      .map((event) => ({
        id: event.id,
        action: event.action,
        status: normalizeProductEventStatus(event.action),
        details: buildProductEventDetails({
          source: event.source,
          entityType: event.entityType,
          entityId: event.entityId,
          properties: event.details,
        }),
        createdAt: event.createdAt,
        triggeredByUserId: event.triggeredByUserId,
        targetUserId: null,
        triggeredByName: event.triggeredByName,
        triggeredByEmail: event.triggeredByEmail,
        targetUserName: null,
        targetUserEmail: null,
      }))
      .filter((event) => !status || event.status === status);

    const logs = sortAndLimitActivityLogs([
      ...systemActivity,
      ...productActivity,
    ], limit);

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    return handleRouteError("Error fetching admin logs", error);
  }
}
