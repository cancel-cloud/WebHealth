import { ImageResponse } from "next/og";

const size = {
  width: 1200,
  height: 630,
};

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 44,
          padding: 64,
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 12,
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: 28, fontWeight: 800 }}>W</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>WebHealth</div>
          </div>
          <div
            style={{
              display: "flex",
              border: "2px solid #bfdbfe",
              borderRadius: 999,
              padding: "12px 20px",
              color: "#1d4ed8",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Demo
          </div>
        </div>

        <div style={{ display: "flex", gap: 42, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f97316" }}>Acme Bakery dashboard</div>
            <div style={{ fontSize: 64, lineHeight: 1.02, fontWeight: 900, letterSpacing: -2 }}>
              See the WebHealth demo before connecting a client site.
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.35, color: "#475569" }}>
              SEO optimization from Search Console, GA4, crawl checks, and AI-assisted review.
            </div>
          </div>

          <div
            style={{
              width: 360,
              height: 350,
              borderRadius: 20,
              border: "2px solid #e2e8f0",
              background: "white",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {[
              ["Clicks", "8,340", "+530"],
              ["SEO priority", "P1", "Custom cakes"],
              ["Evidence", "GSC + GA4", "Crawl"],
            ].map(([label, value, detail]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderRadius: 14,
                  background: "#f8fafc",
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: "#64748b" }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 34, fontWeight: 900 }}>{value}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 22, fontWeight: 700 }}>
          <span>webhealth.devbrew.dev/demo</span>
          <span>SEO optimization demo</span>
        </div>
      </div>
    ),
    size,
  );
}
