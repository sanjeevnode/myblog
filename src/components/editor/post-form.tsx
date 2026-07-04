"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor } from "@tiptap/react";
import {
  RichTextEditor,
  editorExtensions,
} from "@/components/editor/rich-text-editor";
import { CoverImageUpload } from "@/components/editor/cover-image-upload";
import { createPost, updatePost } from "@/lib/posts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Post } from "@/lib/posts/types";

export function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [coverPublicId, setCoverPublicId] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  const editor = useEditor({
    extensions: editorExtensions,
    content: post?.content ?? "",
    immediatelyRender: false,
  });

  async function submit() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const content = editor?.getJSON();
    if (!content || !editor?.getText().trim()) {
      toast.error("Write some content first");
      return;
    }
    setBusy(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const result = post
        ? await updatePost(post.id, {
            title,
            content,
            coverPublicId,
            removeCover: coverRemoved && !coverPublicId,
            tags: tagList,
          })
        : await createPost({ title, content, coverPublicId, tags: tagList });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/post/${result.postId}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong saving the post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <CoverImageUpload
        initialUrl={post?.coverImageUrl}
        onChange={(publicId) => {
          setCoverPublicId(publicId);
          if (!publicId) setCoverRemoved(true);
        }}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="w-full border-0 bg-transparent font-heading text-4xl font-bold outline-none placeholder:text-muted-foreground"
      />
      <RichTextEditor editor={editor} />
      <div className="space-y-1.5">
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated, e.g. tech, life)"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="solid" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : post ? "Update post" : "Publish"}
        </Button>
        <Button onClick={() => router.back()} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
