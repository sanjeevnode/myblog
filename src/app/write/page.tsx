import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PostForm } from "@/components/editor/post-form";
import { SiteHeader } from "@/components/layout/site-header";

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect(`/deactivated?uid=${user.uid}`);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <PostForm />
      </main>
    </>
  );
}
