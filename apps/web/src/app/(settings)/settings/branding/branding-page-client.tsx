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
import { useAppLanguage } from "@/lib/app-language";

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

const BRANDING_COPY = {
  en: {
    loadError: "Could not load branding",
    saveError: "Could not save branding",
    tryAgain: "Please try again.",
    saved: "Branding saved",
    savedDescription: "Snapshot exports will use this branding profile.",
    back: "Back to Settings",
    eyebrow: "Agency branding",
    title: "Brand the exported client surface",
    description: "This is the dedicated source for your agency name, contact details, icon, logo, and export color accents. Snapshot exports should read from here instead of burying branding inside generated payloads.",
    identity: "Identity",
    identityDescription: "Use stable branding values here. This is not per-snapshot copy.",
    agencyName: "Agency name",
    logoUrl: "Logo URL",
    iconUrl: "Icon URL",
    contact: "Contact",
    contactDescription: "The export layer should not guess who the client should contact.",
    contactName: "Contact name",
    contactEmail: "Contact email",
    contactPhone: "Contact phone",
    websiteUrl: "Agency website",
    exportColors: "Export colors",
    exportColorsDescription: "Keep this restrained. These colors should accent exports, not turn them into marketing pages.",
    primaryColor: "Primary color",
    accentColor: "Accent color",
    footerNote: "Footer note",
    footerPlaceholder: "Optional note shown in branded exports.",
    saving: "Saving…",
    save: "Save branding",
    preview: "Preview",
    previewTitle: "Snapshot brand card",
    exportFacing: "Export-facing",
    agencyFallback: "Your agency name",
    preparedFor: "Prepared for branded client snapshots",
    contactNameFallback: "Contact name",
    phoneFallback: "Phone number",
    visitWebsite: "Visit agency website",
    ownsTitle: "What this page owns",
    owns: [
      "Agency identity and contact information for exports.",
      "Default logo/icon URLs used by branded snapshot generation.",
      "Color accents and optional footer copy.",
    ],
    notOwns: "What it does not own: live dashboard analysis, durable action state, or per-snapshot copy edits.",
  },
  de: {
    loadError: "Branding konnte nicht geladen werden",
    saveError: "Branding konnte nicht gespeichert werden",
    tryAgain: "Bitte versuche es erneut.",
    saved: "Branding gespeichert",
    savedDescription: "Snapshot-Exporte nutzen dieses Branding-Profil.",
    back: "Zurück zu Einstellungen",
    eyebrow: "Agentur-Branding",
    title: "Exportierte Kundenflächen branden",
    description: "Dies ist die zentrale Quelle für Agenturname, Kontaktdaten, Icon, Logo und Exportfarben. Snapshot-Exporte lesen von hier, statt Branding in generierten Payloads zu verstecken.",
    identity: "Identität",
    identityDescription: "Nutze hier stabile Branding-Werte. Das ist keine Copy pro Snapshot.",
    agencyName: "Agenturname",
    logoUrl: "Logo-URL",
    iconUrl: "Icon-URL",
    contact: "Kontakt",
    contactDescription: "Die Exportebene sollte nicht raten, wen der Kunde kontaktieren soll.",
    contactName: "Kontaktname",
    contactEmail: "Kontakt-E-Mail",
    contactPhone: "Kontakttelefon",
    websiteUrl: "Agentur-Website",
    exportColors: "Exportfarben",
    exportColorsDescription: "Halte das zurückhaltend. Diese Farben sollen Exporte akzentuieren, nicht in Marketingseiten verwandeln.",
    primaryColor: "Primärfarbe",
    accentColor: "Akzentfarbe",
    footerNote: "Footer-Hinweis",
    footerPlaceholder: "Optionaler Hinweis für gebrandete Exporte.",
    saving: "Speichert…",
    save: "Branding speichern",
    preview: "Vorschau",
    previewTitle: "Snapshot-Brandingkarte",
    exportFacing: "Exportseite",
    agencyFallback: "Dein Agenturname",
    preparedFor: "Vorbereitet für gebrandete Kunden-Snapshots",
    contactNameFallback: "Kontaktname",
    phoneFallback: "Telefonnummer",
    visitWebsite: "Agentur-Website öffnen",
    ownsTitle: "Wofür diese Seite zuständig ist",
    owns: [
      "Agenturidentität und Kontaktdaten für Exporte.",
      "Standard-Logo- und Icon-URLs für gebrandete Snapshot-Erstellung.",
      "Farbliche Akzente und optionale Footer-Copy.",
    ],
    notOwns: "Nicht zuständig für: Live-Dashboard-Analyse, dauerhaften Maßnahmenstatus oder Copy-Änderungen pro Snapshot.",
  },
} as const;

export function BrandingPageClient() {
  const language = useAppLanguage();
  const copy = BRANDING_COPY[language];
  const [profile, setProfile] = useState<TeamBrandingProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = (await requestJson<{ branding?: TeamBrandingProfile }>("/api/settings/branding")) ?? {};
      setProfile({ ...EMPTY_PROFILE, ...(data.branding ?? {}) });
    } catch (error) {
      toast.error(copy.loadError, {
        description: getAppErrorMessage(error, copy.tryAgain),
      });
    } finally {
      setLoading(false);
    }
  }, [copy.loadError, copy.tryAgain]);

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
      toast.success(copy.saved, {
        description: copy.savedDescription,
      });
    } catch (error) {
      toast.error(copy.saveError, {
        description: getAppErrorMessage(error, copy.tryAgain),
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
            {copy.back}
          </Link>
        </Button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Palette className="size-3.5" />
            {copy.eyebrow}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight font-display" style={{ textWrap: "balance" }}>
            {copy.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {copy.description}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg border-border/70 shadow-sm">
          <CardContent className="space-y-8 p-6">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{copy.identity}</h2>
                <p className="text-sm text-muted-foreground">
                  {copy.identityDescription}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="agencyName">{copy.agencyName}</Label>
                  <Input id="agencyName" value={profile.agencyName} onChange={(event) => updateField("agencyName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">{copy.logoUrl}</Label>
                  <Input id="logoUrl" value={profile.logoUrl} onChange={(event) => updateField("logoUrl", event.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iconUrl">{copy.iconUrl}</Label>
                  <Input id="iconUrl" value={profile.iconUrl} onChange={(event) => updateField("iconUrl", event.target.value)} placeholder="https://…" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{copy.contact}</h2>
                <p className="text-sm text-muted-foreground">
                  {copy.contactDescription}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">{copy.contactName}</Label>
                  <Input id="contactName" value={profile.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">{copy.contactEmail}</Label>
                  <Input id="contactEmail" type="email" value={profile.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">{copy.contactPhone}</Label>
                  <Input id="contactPhone" value={profile.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">{copy.websiteUrl}</Label>
                  <Input id="websiteUrl" value={profile.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} placeholder="https://…" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{copy.exportColors}</h2>
                <p className="text-sm text-muted-foreground">
                  {copy.exportColorsDescription}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{copy.primaryColor}</Label>
                  <div className="flex gap-3">
                    <Input id="primaryColor" value={profile.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
                    <Input aria-label={copy.primaryColor} type="color" className="h-10 w-14 rounded-lg p-1" value={profile.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">{copy.accentColor}</Label>
                  <div className="flex gap-3">
                    <Input id="accentColor" value={profile.accentColor} onChange={(event) => updateField("accentColor", event.target.value)} />
                    <Input aria-label={copy.accentColor} type="color" className="h-10 w-14 rounded-lg p-1" value={profile.accentColor} onChange={(event) => updateField("accentColor", event.target.value)} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <Label htmlFor="footerNote">{copy.footerNote}</Label>
              <Textarea
                id="footerNote"
                rows={4}
                value={profile.footerNote}
                onChange={(event) => updateField("footerNote", event.target.value)}
                placeholder={copy.footerPlaceholder}
              />
            </section>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="rounded-full">
                <Save className="mr-2 size-4" />
                {saving ? copy.saving : copy.save}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-border/70 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.preview}</p>
                  <h2 className="text-xl font-semibold tracking-tight">{copy.previewTitle}</h2>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {copy.exportFacing}
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
                      <div className="truncate text-lg font-semibold">{profile.agencyName || copy.agencyFallback}</div>
                      <div className="text-sm text-muted-foreground">{copy.preparedFor}</div>
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
                    <span>{profile.contactName || copy.contactNameFallback}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    <span>{profile.contactEmail || "contact@example.com"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    <span>{profile.contactPhone || copy.phoneFallback}</span>
                  </div>
                  {profile.websiteUrl ? (
                    <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: profile.primaryColor }}>
                      {copy.visitWebsite}
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
              <h3 className="font-semibold text-foreground">{copy.ownsTitle}</h3>
              <ul className="space-y-2">
                {copy.owns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                {copy.notOwns}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
