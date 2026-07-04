import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { getPost } from "@/lib/posts/queries";
import { PostForm } from "@/components/editor/post-form";
import { SiteHeader } from "@/components/layout/site-header";

export default async function EditPostPage({
  params,
}: {
  params: { postId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const post = await getPost(params.postId);
  if (!post) notFound();
  if (post.authorId !== user.uid && !(await isAdmin(user))) redirect(`/post/${post.id}`);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <PostForm post={post} />
      </main>
    </>
  );
}
