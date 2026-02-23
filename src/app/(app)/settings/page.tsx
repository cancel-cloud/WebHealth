"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();

  // Notification toggles (UI-only, no DB backing)
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [reportComplete, setReportComplete] = useState(true);
  const [syncFailure, setSyncFailure] = useState(true);

  const handleSignOutAll = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => { window.location.href = "/"; },
      },
    });
  };

  const handleDisconnectGoogle = () => {
    toast("Google account disconnection is not yet implemented.", { description: "This feature is coming soon." });
  };

  const handleDeleteAccount = () => {
    console.warn("Account deletion requested — not yet implemented.");
    toast("Account deletion is not yet implemented.", { description: "Contact support to delete your account." });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit" style={{ textWrap: "balance" }}>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="plan">Plan & Billing</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{session?.user?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email ?? "—"}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
              Your profile is managed by your Google account. To update your name or photo, visit your Google account settings.
            </p>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-lg font-outfit">Email Notifications</h2>
            <p className="text-sm text-muted-foreground">Notification preferences are not saved yet — this UI is a preview.</p>

            {[
              { label: "Weekly digest email", description: "A summary of your properties' SEO health every week.", checked: weeklyDigest, onChange: setWeeklyDigest },
              { label: "Report complete email", description: "Notify me when an SEO report finishes processing.", checked: reportComplete, onChange: setReportComplete },
              { label: "Sync failure alerts", description: "Alert me when a property sync fails.", checked: syncFailure, onChange: setSyncFailure },
            ].map(({ label, description, checked, onChange }) => (
              <label key={label} className="flex items-center justify-between gap-4 cursor-pointer rounded-xl p-3 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <Switch
                  checked={checked}
                  onCheckedChange={onChange}
                  aria-label={label}
                  className="flex-shrink-0"
                />
              </label>
            ))}
          </div>
        </TabsContent>

        {/* Plan & Billing Tab */}
        <TabsContent value="plan">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg font-outfit">Current Plan</h2>
                <p className="text-sm text-muted-foreground mt-0.5">You are on the Free tier.</p>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-medium">
                Free
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Free", price: "$0", features: ["5 properties", "10 reports/mo", "Community support"], active: true },
                { name: "Pro", price: "$19/mo", features: ["25 properties", "Unlimited reports", "Email support"], active: false },
                { name: "Agency", price: "$79/mo", features: ["Unlimited properties", "Priority support", "Team members"], active: false },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-4 space-y-3 ${plan.active ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20"}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold font-outfit">{plan.name}</p>
                    {plan.active && <Badge className="text-xs bg-primary text-primary-foreground">Current</Badge>}
                  </div>
                  <p className="text-xl font-bold font-outfit">{plan.price}</p>
                  <ul className="space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-muted-foreground">{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/settings/plan">
                Compare all plans
                <ExternalLink aria-hidden="true" className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger">
          <div className="rounded-3xl border border-destructive/30 bg-card p-6 space-y-4">
            <h2 className="font-semibold text-lg font-outfit text-destructive">Danger Zone</h2>

            {/* Sign out all devices */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Sign out of all devices</p>
                <p className="text-xs text-muted-foreground mt-0.5">Revoke all active sessions across all devices.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Sign out all</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign out of all devices?</DialogTitle>
                    <DialogDescription>
                      This will revoke all active sessions. You'll be signed out on this device too.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleSignOutAll}>Sign out all</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Disconnect Google */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Disconnect Google account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Remove Google OAuth access from your account.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">Disconnect</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect Google account?</DialogTitle>
                    <DialogDescription>
                      This will remove Google OAuth access. You may lose access to your properties and reports.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDisconnectGoogle}>Disconnect</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Delete account */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
              <div>
                <p className="text-sm font-medium text-destructive">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Delete account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogDescription>
                      This action is <strong>permanent and irreversible</strong>. All your properties, reports, and data will be deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteAccount}>Yes, delete my account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
