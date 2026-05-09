"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ExternalLink,
  ImageIcon,
  Mail,
  Palette,
  Phone,
  Save,
  User2,
} from "lucide-react";
import type { TeamBrandingProfile } from "@webhealth/shared/lib/team-branding";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EMPTY_PROFILE: TeamBrandingProfile = {
  agencyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  websiteUrl: "",
  logoUrl: "",
  iconUrl: "",
  primaryColor: "#6366f1",
  accentColor: "#0ea5e9",
  footerNote: "",
};

export function BrandingPageClient() {
  const [profile, setProfile] = useState<TeamBrandingProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = (await requestJson<{ branding?: TeamBrandingProfile }>("/api/settings/branding")) ?? {};
      setProfile({ ...EMPTY_PROFILE, ...(data.branding ?? {}) });
    } catch (error) {
      toast.error("Could not load branding", {
        description: getAppErrorMessage(error, "Please try again."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateField = <K extends keyof TeamBrandingProfile>(key: K, value: TeamBrandingProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data =
        (await requestJson<{ branding?: TeamBrandingProfile }>("/api/settings/branding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        })) ?? {};
      setProfile({ ...EMPTY_PROFILE, ...(data.branding ?? {}) });
      toast.success("Branding saved", {
        description: "Snapshot exports will use this branding profile.",
      });
    } catch (error) {
      toast.error("Could not save branding", {
        description: getAppErrorMessage(error, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[560px] rounded-lg" />
          <Skeleton className="h-[560px] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/settings">
            <ChevronLeft className="mr-1 size-4" />
            Back to Settings
          </Link>
        </Button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Palette className="size-3.5" />
            Agency branding
          </div>
          <h1 className="text-3xl font-semibold tracking-tight font-display" style={{ textWrap: "balance" }}>
            Brand the exported client surface
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            This is the dedicated source for your agency name, contact details, icon, logo, and export color accents.
            Snapshot exports should read from here instead of burying branding inside generated payloads.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg border-border/70 shadow-sm">
          <CardContent className="space-y-8 p-6">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Identity</h2>
                <p className="text-sm text-muted-foreground">
                  Use stable branding values here. This is not per-snapshot copy.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="agencyName">Agency name</Label>
                  <Input id="agencyName" value={profile.agencyName} onChange={(event) => updateField("agencyName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" value={profile.logoUrl} onChange={(event) => updateField("logoUrl", event.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iconUrl">Icon URL</Label>
                  <Input id="iconUrl" value={profile.iconUrl} onChange={(event) => updateField("iconUrl", event.target.value)} placeholder="https://…" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
                <p className="text-sm text-muted-foreground">
                  The export layer should not guess who the client should contact.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact name</Label>
                  <Input id="contactName" value={profile.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact email</Label>
                  <Input id="contactEmail" type="email" value={profile.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact phone</Label>
                  <Input id="contactPhone" value={profile.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Agency website</Label>
                  <Input id="websiteUrl" value={profile.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} placeholder="https://…" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Export colors</h2>
                <p className="text-sm text-muted-foreground">
                  Keep this restrained. These colors should accent exports, not turn them into marketing pages.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <div className="flex gap-3">
                    <Input id="primaryColor" value={profile.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
                    <Input aria-label="Primary color picker" type="color" className="h-10 w-14 rounded-lg p-1" value={profile.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent color</Label>
                  <div className="flex gap-3">
                    <Input id="accentColor" value={profile.accentColor} onChange={(event) => updateField("accentColor", event.target.value)} />
                    <Input aria-label="Accent color picker" type="color" className="h-10 w-14 rounded-lg p-1" value={profile.accentColor} onChange={(event) => updateField("accentColor", event.target.value)} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <Label htmlFor="footerNote">Footer note</Label>
              <Textarea
                id="footerNote"
                rows={4}
                value={profile.footerNote}
                onChange={(event) => updateField("footerNote", event.target.value)}
                placeholder="Optional note shown in branded exports."
              />
            </section>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="rounded-full">
                <Save className="mr-2 size-4" />
                {saving ? "Saving…" : "Save branding"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-border/70 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Preview</p>
                  <h2 className="text-xl font-semibold tracking-tight">Snapshot brand card</h2>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Export-facing
                </Badge>
              </div>

              <div className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-12 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/30"
                      style={{ borderColor: `${profile.primaryColor}33`, backgroundColor: `${profile.primaryColor}14` }}
                    >
                      {profile.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.iconUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageIcon className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold">{profile.agencyName || "Your agency name"}</div>
                      <div className="text-sm text-muted-foreground">Prepared for branded client snapshots</div>
                    </div>
                  </div>
                  {profile.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.logoUrl} alt="" className="h-10 max-w-28 rounded-md object-contain" />
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User2 className="size-4" />
                    <span>{profile.contactName || "Contact name"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    <span>{profile.contactEmail || "contact@example.com"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    <span>{profile.contactPhone || "Phone number"}</span>
                  </div>
                  {profile.websiteUrl ? (
                    <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: profile.primaryColor }}>
                      Visit agency website
                      <ExternalLink className="size-4" />
                    </a>
                  ) : null}
                </div>

                <div className="mt-5 flex gap-2">
                  <span className="h-3 w-16 rounded-full" style={{ backgroundColor: profile.primaryColor }} />
                  <span className="h-3 w-12 rounded-full" style={{ backgroundColor: profile.accentColor }} />
                </div>

                {profile.footerNote ? (
                  <p className="mt-5 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                    {profile.footerNote}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/70 shadow-sm">
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <h3 className="font-semibold text-foreground">What this page owns</h3>
              <ul className="space-y-2">
                <li>Agency identity and contact information for exports.</li>
                <li>Default logo/icon URLs used by branded snapshot generation.</li>
                <li>Color accents and optional footer copy.</li>
              </ul>
              <p>
                What it does not own: live dashboard analysis, durable action state, or per-snapshot copy edits.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
