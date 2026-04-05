import { getSessionUser } from "@/lib/auth";
import { getOwnedAgents } from "@/lib/fleet";

/**
 * GET /api/fleet/export — CSV export of the caller's owned agents.
 *
 * Authenticated. Returns text/csv with a Content-Disposition
 * attachment header so browsers download the file directly.
 */

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, "\"\"")}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await getOwnedAgents(user.id);

  const header = ["name", "did", "tier", "score", "lastActivity", "handshakeCount"];
  const rows = agents.map((a) =>
    [
      csvEscape(a.name),
      csvEscape(a.did),
      csvEscape(a.trustTier),
      csvEscape(a.overallScore),
      csvEscape(a.lastActive.toISOString()),
      csvEscape(a.handshakeCount),
    ].join(",")
  );

  const csv = [header.join(","), ...rows].join("\n") + "\n";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="verascore-fleet.csv"',
    },
  });
}
