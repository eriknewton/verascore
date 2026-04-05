/**
 * GET /api/badge/[did] — SVG badge (240x64) for embedding on agent sites.
 * Obsidian palette. Edge runtime. Cache 5 minutes.
 */

export const runtime = "edge";

const TIER_LABELS: Record<string, string> = {
  "verified-sovereign": "SOVEREIGN",
  "verified-degraded": "VERIFIED (DEGRADED)",
  "self-attested": "SELF-ATTESTED",
  unverified: "UNVERIFIED",
};

const TIER_ACCENTS: Record<string, string> = {
  "verified-sovereign": "#54dcbd", // Security Green
  "verified-degraded": "#adc6ff", // AI Blue
  "self-attested": "#e9c400", // Warning Gold
  unverified: "#8b90a0", // Muted
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchAgent(did: string, origin: string): Promise<{ overallScore: number; trustTier: string } | null> {
  try {
    const res = await fetch(`${origin}/api/agents/${encodeURIComponent(did)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { overallScore?: number; trustTier?: string };
    if (typeof json.overallScore !== "number" || typeof json.trustTier !== "string") return null;
    return { overallScore: json.overallScore, trustTier: json.trustTier };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  const decodedDid = decodeURIComponent(did);

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const agent = await fetchAgent(decodedDid, origin);
  const score = agent?.overallScore ?? 0;
  const tier = agent?.trustTier ?? "unverified";
  const tierLabel = TIER_LABELS[tier] ?? "UNVERIFIED";
  const accent = TIER_ACCENTS[tier] ?? "#8b90a0";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" viewBox="0 0 240 64" role="img" aria-label="Verascore Badge: ${escapeXml(tierLabel)} ${score}/100">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d131e"/>
      <stop offset="100%" stop-color="#161c27"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="240" height="64" rx="8" fill="url(#bg)"/>
  <rect width="240" height="64" rx="8" fill="url(#accent)"/>
  <rect x="0.5" y="0.5" width="239" height="63" rx="7.5" fill="none" stroke="${accent}" stroke-opacity="0.35"/>
  <!-- left accent stripe -->
  <rect x="0" y="0" width="4" height="64" fill="${accent}"/>
  <!-- Score -->
  <text x="16" y="30" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" font-weight="700" fill="#dde2f2">${score}</text>
  <text x="54" y="30" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#8b90a0">/100</text>
  <!-- Tier label -->
  <text x="16" y="46" font-family="'Space Grotesk', system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.08em" fill="${accent}">${escapeXml(tierLabel)}</text>
  <!-- Wordmark -->
  <text x="224" y="56" text-anchor="end" font-family="'Space Grotesk', system-ui, sans-serif" font-size="9" font-weight="600" letter-spacing="0.06em" fill="#c1c6d6">verascore.ai</text>
  <!-- Shield glyph -->
  <g transform="translate(200, 14)" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2 L22 6 L22 14 C22 20 17 24 12 26 C7 24 2 20 2 14 L2 6 Z"/>
    <path d="M8 13 L11 16 L17 10"/>
  </g>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
