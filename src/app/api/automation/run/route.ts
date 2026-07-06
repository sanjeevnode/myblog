import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/automation/pipeline";

export const dynamic = "force-dynamic";
// Generation + publish + share can take a while; raise the serverless limit.
export const maxDuration = 300;

/**
 * Full automation run in one request: Gemini generates a post, it is published
 * to the blog as the owner, then shared on LinkedIn. Trigger from a cronjob:
 *
 *   POST /api/automation/run?linkedin_delay=5
 *   Authorization: Bearer <INTERNAL_API_SECRET>
 *
 * Runs synchronously and returns { postId, title, linkedinUrn }.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const delayParam = req.nextUrl.searchParams.get("linkedin_delay");
  const linkedinDelaySeconds = delayParam ? Number(delayParam) : 0;
  if (Number.isNaN(linkedinDelaySeconds)) {
    return NextResponse.json({ error: "linkedin_delay must be a number" }, { status: 400 });
  }

  try {
    const result = await runPipeline({ linkedinDelaySeconds });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[automation] run failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
