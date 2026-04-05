/**
 * GET /api/discovery
 *
 * Lists the 50 most recent agents. Filters claimStatus=stub by default
 * (task spec language); since this codebase uses only "claimed"/"unclaimed",
 * we hide `unverified` tier unclaimed agents by default, unless
 * ?include_stubs=true.
 */

import { NextRequest } from "next/server";
import { getAgents } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const includeStubs = searchParams.get("include_stubs") === "true";

  const result = await getAgents({
    page: 1,
    pageSize: 50,
    sortBy: "recent",
  });

  const agents = includeStubs
    ? result.data
    : result.data.filter(
        (a) => !(a.claimStatus === "unclaimed" && a.trustTier === "unverified")
      );

  return Response.json(
    { agents },
    {
      headers: {
        "cache-control": "public, max-age=30",
      },
    }
  );
}
