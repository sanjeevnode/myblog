import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const COVER_FOLDER = "myblog/covers";
export const MAX_COVER_BYTES = 3 * 1024 * 1024; // 3MB hard limit

/**
 * Signed upload params for a cover image. The signature covers the folder and
 * allowed_formats, so a client can't upload outside the folder or with another
 * format. Size is enforced server-side again when the post is saved.
 */
export function signCoverUpload(timestamp: number) {
  const params = {
    timestamp,
    folder: COVER_FOLDER,
    allowed_formats: "jpg,png,webp",
  };
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  };
}

/** Verify an uploaded asset belongs to our folder and respects the 3MB/format limits. */
export async function verifyCoverAsset(publicId: string): Promise<string | null> {
  if (!publicId.startsWith(`${COVER_FOLDER}/`)) return null;
  const asset = await cloudinary.api.resource(publicId);
  if (asset.bytes > MAX_COVER_BYTES) {
    await cloudinary.uploader.destroy(publicId);
    return null;
  }
  if (!["jpg", "jpeg", "png", "webp"].includes(asset.format)) {
    await cloudinary.uploader.destroy(publicId);
    return null;
  }
  return asset.secure_url as string;
}
