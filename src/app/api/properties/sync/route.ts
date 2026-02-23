import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { properties, teamMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGoogleAuthClient, fetchGscProperties, fetchGa4Properties } from '@/lib/google/api';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Google account to retrieve the access token
    const accounts = await db.query.account.findMany({
      where: (account, { eq }) => eq(account.userId, session.user.id),
    });

    const googleAccount = accounts.find((a) => a.providerId === 'google');

    if (!googleAccount || !googleAccount.accessToken) {
      return NextResponse.json({ error: 'Google account not linked' }, { status: 400 });
    }

    // Get the user's primary team (for simplicity, we'll grab the first one they own or are a member of)
    const userTeams = await db.query.teamMembers.findMany({
        where: (tm, {eq}) => eq(tm.userId, session.user.id)
    });
    
    if (userTeams.length === 0) {
        return NextResponse.json({ error: 'No team found for user' }, { status: 400 });
    }
    const targetTeamId = userTeams[0].teamId;

    const authClient = getGoogleAuthClient(
      googleAccount.accessToken,
      googleAccount.refreshToken || undefined
    );

    const [gscSites, ga4Accounts] = await Promise.all([
      fetchGscProperties(authClient),
      fetchGa4Properties(authClient),
    ]);

    const newProperties = [];

    // Process GSC Properties
    for (const site of gscSites) {
      if (!site.siteUrl) continue;
      
      const propertyId = `gsc_${site.siteUrl}`;
      const existing = await db.query.properties.findFirst({
        where: (p, { eq }) => eq(p.id, propertyId)
      });

      if (!existing) {
        newProperties.push({
          id: propertyId,
          teamId: targetTeamId,
          type: 'gsc',
          name: site.siteUrl.replace('sc-domain:', '').replace('https://', '').replace(/\/$/, ''),
          url: site.siteUrl,
          syncStatus: 'complete',
          lastSyncedAt: new Date()
        });
      }
    }

    // A more complex implementation would extract the GA4 properties from the accountSummaries and link them to GSC
    // For now, we will just store the GSC properties

    if (newProperties.length > 0) {
      await db.insert(properties).values(newProperties);
    }

    return NextResponse.json({ success: true, count: newProperties.length });
  } catch (error: any) {
    console.error('Error syncing properties:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
