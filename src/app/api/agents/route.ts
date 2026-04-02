import { NextRequest } from "next/server";
import { getAgents } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = getAgents({
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
    pageSize: searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : 20,
    search: searchParams.get("q") || undefined,
    trustTier: searchParams.get("tier") || undefined,
    minScore: searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined,
    maxScore: searchParams.get("maxScore")
      ? parseInt(searchParams.get("maxScore")!)
      : undefined,
    sortBy:
      (searchParams.get("sort") as "score" | "recent" | "sovereignty") ||
      "score",
  });

  return Response.json(result);
}
