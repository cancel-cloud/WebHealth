import { NextResponse } from 'next/server';
import { syncPropertiesForUser } from "@webhealth/shared/lib/sync-properties";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { handleRouteError } from "@/lib/server/route-security";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import {
  getGoogleAccessHealthForUser,
  shouldBlockGoogleAction,
  toGoogleAccessPublicError,
} from "@/lib/server/google-access";

export async function POST(req: Request) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);

    const health = await getGoogleAccessHealthForUser(session.user.id);
    if (shouldBlockGoogleAction(health)) {
      const publicError = toGoogleAccessPublicError(health);
      if (publicError) {
        return NextResponse.json(publicError.body, { status: publicError.status });
      }
    }

    const googleAccount = await getGoogleAccountTokensForUser(session.user.id);
    if (!googleAccount?.accessToken) {
      throw badRequest("GOOGLE_ACCOUNT_NOT_LINKED", "Google account not linked");
    }

    const body = await req.json().catch(() => null) as { mode?: unknown } | null;
    const isOnboardingMode = body?.mode === "onboarding";

    // TODO(team-authz): Current product behavior assumes one effective team per user.
    // When real multi-team support is added, sync authorization must resolve the target team explicitly.
    const result = await syncPropertiesForUser({
      userId: session.user.id,
      teamId: ownerMembership.teamId,
      accessToken: googleAccount.accessToken,
      refreshToken: googleAccount.refreshToken ?? undefined,
      accessTokenExpiresAt: googleAccount.accessTokenExpiresAt ?? null,
      autoLink: !isOnboardingMode,
      probeDataStartDate: !isOnboardingMode,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return handleRouteError("Error syncing properties", error);
  }
}
