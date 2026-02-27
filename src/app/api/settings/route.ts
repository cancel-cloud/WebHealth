import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

const ALLOWED_FIELDS = ['weeklyDigest', 'reportComplete', 'syncFailure', 'emailReceipts', 'reportLanguage'] as const;

// GET /api/settings — fetch (or upsert defaults for) the current user's settings
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    if (existing) {
      const { weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage } = existing;
      return NextResponse.json({ weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage });
    }

    // No row yet — upsert defaults and return them
    const [created] = await db
      .insert(userSettings)
      .values({ id: nanoid(), userId })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { updatedAt: new Date() },
      })
      .returning();

    const { weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage } = created;
    return NextResponse.json({ weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/settings — upsert partial settings update for the current user
export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();

    // Only pick allowed fields from the request body
    const patch: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field === 'reportLanguage') {
        if (typeof body[field] === 'string' && body[field].trim()) {
          patch[field] = body[field].trim().toLowerCase();
        }
      } else if (typeof body[field] === 'boolean') {
        patch[field] = body[field];
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const [updated] = await db
      .insert(userSettings)
      .values({ id: nanoid(), userId, ...patch })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...patch, updatedAt: new Date() },
      })
      .returning();

    const { weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage } = updated;
    return NextResponse.json({ weeklyDigest, reportComplete, syncFailure, emailReceipts, reportLanguage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('PATCH /api/settings error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
