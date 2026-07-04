import { NextRequest, NextResponse } from "next/server";
import { createPostCore } from "@/lib/posts/create-post-core";

export const dynamic = "force-dynamic";

/**
 * Sole entry point for myblog-automation. Bearer-secret authenticated; a thin
 * wrapper around the same createPostCore used by the user-facing Server Action,
 * so automated posts are structurally identical to manual ones.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    authorId?: string;
    title?: string;
    content?: object;
    tags?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.authorId || !body.title || !body.content) {
    return NextResponse.json(
      { error: "authorId, title and content are required" },
      { status: 400 }
    );
  }

  try {
    const postId = await createPostCore({
      authorId: body.authorId,
      title: body.title,
      content: body.content,
      tags: body.tags,
      published: true,
    });
    return NextResponse.json({ postId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status =
      message === "AUTHOR_NOT_FOUND" || message === "AUTHOR_DEACTIVATED" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
