import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { createPostCore } from "@/lib/posts/create-post-core";
import { generatePost } from "@/lib/automation/gemini";
import { publishSummary } from "@/lib/automation/linkedin";

export type PipelineResult = {
  postId: string;
  title: string;
  linkedinUrn: string | null;
  linkedinError: string | null;
};

async function notifyOwner(ownerId: string, message: string, postId?: string) {
  try {
    await adminDb.collection("notifications").add({
      recipientId: ownerId,
      type: "automation",
      actorName: "Automation",
      message,
      postId: postId ?? null,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[automation] notify failed:", err);
  }
}

async function recentTitles(): Promise<string[]> {
  try {
    const snap = await adminDb
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(25)
      .select("title")
      .get();
    return snap.docs.map((d) => d.data().title ?? "");
  } catch {
    return []; // best-effort — a run without dedup beats no run
  }
}

/**
 * The full automation run, in-process: Gemini -> Firestore post -> LinkedIn.
 * Unlike the old FastAPI service there is no hour-long wait — a serverless
 * request can't sleep that long, so the share happens right after publishing
 * (optionally after a short capped delay).
 */
export async function runPipeline(opts: { linkedinDelaySeconds?: number } = {}): Promise<PipelineResult> {
  const ownerId = process.env.OWNER_FIREBASE_UID;
  if (!ownerId) throw new Error("OWNER_FIREBASE_UID not configured");

  // 1. Generate (recent titles keep topics from repeating)
  let post;
  try {
    post = await generatePost(await recentTitles());
  } catch (err) {
    await notifyOwner(ownerId, "Automation: Gemini post generation failed — no post was published.");
    throw err;
  }

  // 2. Create the blog post as the owner
  let postId: string;
  try {
    postId = await createPostCore({
      authorId: ownerId,
      title: post.title,
      content: post.content,
      tags: post.tags,
      published: true,
    });
  } catch (err) {
    await notifyOwner(ownerId, `Automation: blog post creation failed for '${post.title}'.`);
    throw err;
  }

  // 3. Share on LinkedIn. Delay is capped well under the function timeout.
  const delay = Math.min(Math.max(opts.linkedinDelaySeconds ?? 0, 0), 120);
  if (delay > 0) await new Promise((r) => setTimeout(r, delay * 1000));

  const summary = `${post.linkedinSummary}\n\nRead the full post: ${
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.sanjeevnode.in"
  }/post/${postId}`;
  try {
    const urn = await publishSummary(summary);
    return { postId, title: post.title, linkedinUrn: urn, linkedinError: null };
  } catch (err) {
    // Blog post succeeded but LinkedIn failed — must not fail silently.
    const message = err instanceof Error ? err.message : String(err);
    await notifyOwner(
      ownerId,
      `Automation: post '${post.title}' was published to the blog, but the LinkedIn share failed: ${message}`,
      postId
    );
    return { postId, title: post.title, linkedinUrn: null, linkedinError: message };
  }
}
