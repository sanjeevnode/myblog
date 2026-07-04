export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: object; // Tiptap JSON document
  coverImageUrl: string | null;
  tags: string[];
  published: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type CommentDoc = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

/** Plain-text excerpt from a Tiptap JSON doc, for feed cards. */
export function excerptFromContent(content: unknown, maxLen = 200): string {
  const parts: string[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as { text?: string; content?: unknown[] };
    if (typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(content);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}
