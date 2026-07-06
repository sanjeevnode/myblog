import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/automation/pipeline";

export const dynamic = "force-dynamic";
// Generation + publish + share can take a while; raise the serverless limit.
export const maxDuration = 300;

/**
 * Full automation run in one request: Gemini generates a post, it is published
 * to the blog as the owner, then shared on LinkedIn. Trigger from a cronjob:
 *
 *   POST /api/automation/run
 *   Authorization: Bearer <INTERNAL_API_SECRET>
 *   Body (JSON, all fields optional):
 *     {
 *       "linkedin_delay": 5,            // seconds before the share, default 0 (max 120)
 *       "generate_image": true,         // default true
 *       "create_linkedin_post": true    // default true; false publishes blog only
 *     }
 *
 * Runs synchronously and returns { postId, title, postUrl, linkedinUrn, linkedinPost }.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Body is entirely optional — an empty POST runs with defaults.
  let body: {
    linkedin_delay?: unknown;
    generate_image?: unknown;
    create_linkedin_post?: unknown;
  } = {};
  const raw = await req.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }
  }

  const linkedinDelaySeconds = body.linkedin_delay === undefined ? 0 : Number(body.linkedin_delay);
  if (Number.isNaN(linkedinDelaySeconds)) {
    return NextResponse.json({ error: "linkedin_delay must be a number" }, { status: 400 });
  }
  const generateImage = body.generate_image !== false; // default true
  const createLinkedinPost = body.create_linkedin_post !== false; // default true

  try {
    const result = await runPipeline({ linkedinDelaySeconds, generateImage, createLinkedinPost });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[automation] run failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
