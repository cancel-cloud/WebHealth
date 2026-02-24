import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { properties, teamMembers } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
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

    const accounts = await db.query.account.findMany({
      where: (account, { eq }) => eq(account.userId, session.user.id),
    });

    const googleAccount = accounts.find((a) => a.providerId === 'google');

    if (!googleAccount || !googleAccount.accessToken) {
      return NextResponse.json({ error: 'Google account not linked' }, { status: 400 });
    }

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });

    if (userTeams.length === 0) {
      return NextResponse.json({ error: 'No team found for user' }, { status: 400 });
    }
    const targetTeamId = userTeams[0].teamId;

    const authClient = getGoogleAuthClient(
      googleAccount.accessToken,
      googleAccount.refreshToken || undefined
    );

    const [gscSites, ga4Props] = await Promise.all([
      fetchGscProperties(authClient),
      fetchGa4Properties(authClient),
    ]);

    // --- Store GSC properties ---
    let gscCount = 0;
    const gscToInsert = [];
    for (const site of gscSites) {
      if (!site.siteUrl) continue;

      const propertyId = `gsc_${site.siteUrl}`;
      const existing = await db.query.properties.findFirst({
        where: (p, { eq }) => eq(p.id, propertyId),
      });

      if (!existing) {
        gscToInsert.push({
          id: propertyId,
          teamId: targetTeamId,
          type: 'gsc' as const,
          name: site.siteUrl.replace('sc-domain:', '').replace('https://', '').replace(/\/$/, ''),
          url: site.siteUrl,
          syncStatus: 'complete',
          lastSyncedAt: new Date(),
        });
        gscCount++;
      }
    }
    if (gscToInsert.length > 0) {
      await db.insert(properties).values(gscToInsert);
    }

    // --- Store GA4 properties ---
    let ga4Count = 0;
    const ga4ToInsert = [];
    for (const ga4 of ga4Props) {
      const propertyId = `ga4_${ga4.propertyId}`;
      const existing = await db.query.properties.findFirst({
        where: (p, { eq }) => eq(p.id, propertyId),
      });

      if (!existing) {
        ga4ToInsert.push({
          id: propertyId,
          teamId: targetTeamId,
          type: 'ga4' as const,
          name: ga4.displayName,
          url: ga4.displayName,
          syncStatus: 'complete',
          lastSyncedAt: new Date(),
        });
        ga4Count++;
      }
    }
    if (ga4ToInsert.length > 0) {
      await db.insert(properties).values(ga4ToInsert);
    }

    // --- Auto-match GSC → GA4 by domain ---
    let autoLinked = 0;
    const unlinkedGsc = await db.query.properties.findMany({
      where: (p, { and, eq, isNull }) =>
        and(eq(p.teamId, targetTeamId), eq(p.type, 'gsc'), isNull(p.ga4PropertyId)),
    });

    for (const gscProp of unlinkedGsc) {
      // Extract domain from siteUrl (strip sc-domain:, https://, trailing /)
      const domain = gscProp.url
        .replace('sc-domain:', '')
        .replace('https://', '')
        .replace('http://', '')
        .replace(/\/$/, '')
        .toLowerCase();

      // Find a GA4 property whose displayName contains this domain
      const match = ga4Props.find((ga4) =>
        ga4.displayName.toLowerCase().includes(domain) ||
        domain.includes(ga4.displayName.toLowerCase().replace(/^www\./, ''))
      );

      if (match) {
        await db
          .update(properties)
          .set({ ga4PropertyId: match.propertyId })
          .where(eq(properties.id, gscProp.id));
        autoLinked++;
      }
    }

    return NextResponse.json({ success: true, gscCount, ga4Count, autoLinked });
  } catch (error: any) {
    console.error('Error syncing properties:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
