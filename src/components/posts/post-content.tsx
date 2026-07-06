import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

/**
 * Server-side render of Tiptap JSON through the schema serializer — never raw
 * user HTML. Unknown node types are rejected by the schema.
 */
export function PostContent({ content }: { content: object }) {
  let html = "";
  try {
    html = generateHTML(content as Parameters<typeof generateHTML>[0], [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    ]);
  } catch {
    html = "<p>(This post could not be rendered.)</p>";
  }
  return (
    <div
      className="article-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
