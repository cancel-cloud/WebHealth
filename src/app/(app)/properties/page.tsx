"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { SyncButton } from "../dashboard/sync-button";

type Property = {
  id: string;
  name: string;
  url: string;
  type: string;
  syncStatus: string;
  lastSyncedAt: string | null;
};

function getSyncStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge className="bg-green-500/10 text-green-600 border border-green-200 hover:bg-green-500/20">Complete</Badge>;
    case "syncing":
      return <Badge className="bg-blue-500/10 text-blue-600 border border-blue-200 animate-pulse">Syncing</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-zinc-500">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit" style={{ textWrap: "balance" }}>
            Properties
          </h1>
          <p className="text-muted-foreground mt-1">Google Search Console and Analytics properties synced to your account.</p>
        </div>
        <SyncButton />
      </div>

      {loading ? (
        <div className="border border-border/50 rounded-3xl p-8 bg-card">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="border border-border/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-card shadow-sm">
          <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
            <Globe aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-foreground font-outfit">No properties synced</h3>
          <p className="max-w-sm mt-3 text-muted-foreground leading-relaxed">
            Click <strong>Sync Properties</strong> to fetch your Google Search Console and Analytics properties.
          </p>
        </div>
      ) : (
        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-4 font-medium">Name</TableHead>
                <TableHead className="py-4 font-medium">URL</TableHead>
                <TableHead className="py-4 font-medium">Type</TableHead>
                <TableHead className="py-4 font-medium">Sync Status</TableHead>
                <TableHead className="py-4 font-medium text-right">Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium py-4">{property.name}</TableCell>
                  <TableCell className="py-4 text-muted-foreground text-sm truncate max-w-[200px]">
                    {property.url}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="uppercase text-xs font-mono">
                      {property.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">{getSyncStatusBadge(property.syncStatus)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm py-4">
                    {property.lastSyncedAt
                      ? new Date(property.lastSyncedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
