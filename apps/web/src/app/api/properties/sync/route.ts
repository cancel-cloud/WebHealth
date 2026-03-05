import { NextResponse } from 'next/server';
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { syncPropertiesForUser } from "@webhealth/shared/lib/sync-properties";
import { headers } from 'next/headers';

export async function POST(_req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await db.query.account.findMany({
      where: (account, { eq }) => eq(account.userId, session.user.id),
    });
    const googleAccount = accounts.find((a) => a.providerId === 'google');
    if (!googleAccount?.accessToken) {
      return NextResponse.json({ error: 'Google account not linked' }, { status: 400 });
    }

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) {
      return NextResponse.json({ error: 'No team found for user' }, { status: 400 });
    }

    const result = await syncPropertiesForUser({
      userId: session.user.id,
      teamId: userTeams[0].teamId,
      accessToken: googleAccount.accessToken,
      refreshToken: googleAccount.refreshToken ?? undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error('Error syncing properties:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
