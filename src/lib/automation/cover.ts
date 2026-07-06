import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { COVER_FOLDER, MAX_COVER_BYTES } from "@/lib/cloudinary";

/**
 * Generate a cover image with pollinations.ai from the one-line image prompt
 * Gemini wrote for the post, then store it in our Cloudinary covers folder.
 * Best-effort: returns null on any failure — a post without a cover beats
 * no post.
 */
export async function makeCover(imagePrompt: string): Promise<string | null> {
  try {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}` +
      `?width=1200&height=630&nologo=true&seed=${seed}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    if (!res.ok) throw new Error(`pollinations ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`unexpected content-type: ${contentType}`);
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength > MAX_COVER_BYTES) {
      throw new Error(`image too large: ${bytes.byteLength} bytes (max ${MAX_COVER_BYTES})`);
    }
    if (bytes.byteLength < 1024) throw new Error("image suspiciously small");

    const mime = contentType.split(";")[0];
    const upload = await cloudinary.uploader.upload(
      `data:${mime};base64,${bytes.toString("base64")}`,
      { folder: COVER_FOLDER, resource_type: "image" }
    );
    console.log(`[automation] cover uploaded: ${upload.public_id}`);
    return upload.secure_url as string;
  } catch (err) {
    console.warn("[automation] cover generation failed, posting without cover:", err);
    return null;
  }
}
