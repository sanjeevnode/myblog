"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { getCoverUploadSignature } from "@/lib/posts/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_BYTES = 3 * 1024 * 1024;

export function CoverImageUpload({
  initialUrl,
  onChange,
}: {
  initialUrl?: string | null;
  onChange: (publicId: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Cover image must be 3MB or smaller.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG or WebP images are allowed.");
      return;
    }
    setBusy(true);
    try {
      const signed = await getCoverUploadSignature(file.size, file.type);
      if (!signed.ok) {
        toast.error(signed.error);
        return;
      }
      const { params } = signed;
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", params.apiKey);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", params.signature);
      form.append("folder", params.folder);
      form.append("allowed_formats", params.allowed_formats);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Upload failed");
        return;
      }
      setPreviewUrl(data.secure_url);
      onChange(data.public_id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {previewUrl ? (
        <div className="border-2 border-border">
          <div className="relative aspect-[2/1] w-full">
            <Image src={previewUrl} alt="Cover image" fill className="object-cover" unoptimized />
          </div>
          <div className="flex gap-2 border-t-2 border-border p-2">
            <Button type="button" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPreviewUrl(null);
                onChange(null);
              }}
              disabled={busy}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex aspect-[3/1] w-full items-center justify-center border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary"
        >
          {busy ? "Uploading…" : "+ Add cover image (optional, max 3MB)"}
        </button>
      )}
    </div>
  );
}
