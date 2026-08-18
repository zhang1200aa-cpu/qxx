import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";

/** 默认 OG 分享图（1200×630 PNG）—— 由 next/og 服务端渲染 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 装饰网格 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            width: "100%",
            height: "100%",
            opacity: 0.06,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* 装饰圆形 */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.04)",
          }}
        />
        {/* 建筑条（伦敦天际线抽象） */}
        <div style={{ position: "absolute", right: 60, bottom: 0, display: "flex", opacity: 0.15, alignItems: "flex-end" }}>
          {[120, 160, 90, 200, 110, 170, 140, 220, 96].map((h, i) => (
            <div key={i} style={{ width: 22, height: h, background: "white", marginLeft: 4, borderRadius: "4px 4px 0 0" }} />
          ))}
        </div>

        {/* 品牌标记 */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 30 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <div style={{ width: 4, height: 24, background: "#2563eb", borderRadius: 2 }} />
              <div style={{ width: 4, height: 32, background: "#1e40af", borderRadius: 2 }} />
              <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, opacity: 0.7 }} />
            </div>
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>{siteConfig.name}</div>
        </div>

        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, maxWidth: 620 }}>
          UK Company &amp; Tax Intelligence
        </div>
        <div style={{ marginTop: 24, fontSize: 26, opacity: 0.82, maxWidth: 560, lineHeight: 1.5 }}>
          Instant Companies House, HMRC &amp; ONS data. Free, no sign-up.
        </div>

        {/* 特征行 */}
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 12, fontSize: 22, opacity: 0.85 }}>
          {["Companies House lookup", "HMRC VAT verification", "UK postcode data"].map((t) => (
            <div key={t} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 9999, background: "#60a5fa" }} />
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* 底部 URL */}
        <div style={{ position: "absolute", bottom: 40, left: 80, right: 80, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 24, fontWeight: 600, opacity: 0.9 }}>
          <span>{siteConfig.url}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}