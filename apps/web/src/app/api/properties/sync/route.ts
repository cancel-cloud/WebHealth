import { NextResponse } from 'next/server';
import { syncPropertiesForUser } from "@webhealth/shared/lib/sync-properties";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";
import { badRequest, unauthorized } from "@webhealth/shared/lib/http-errors";
import { handleRouteError } from "@/lib/server/route-security";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";

export async function POST(_req: Request) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);

    const googleAccount = await getGoogleAccountTokensForUser(session.user.id);
    if (!googleAccount?.accessToken) {
      throw badRequest("GOOGLE_ACCOUNT_NOT_LINKED", "Google account not linked");
    }

    const result = await syncPropertiesForUser({
      userId: session.user.id,
      teamId: ownerMembership.teamId,
      accessToken: googleAccount.accessToken,
      refreshToken: googleAccount.refreshToken ?? undefined,
      accessTokenExpiresAt: googleAccount.accessTokenExpiresAt ?? null,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const code = (error as any)?.code;
    if (code === "GOOGLE_AUTH_RELOGIN_REQUIRED") {
      return NextResponse.json(
        { error: "Google authorization expired. Please sign in again.", code },
        { status: 401 }
      );
    }
    return handleRouteError("Error syncing properties", error);
  }
}
