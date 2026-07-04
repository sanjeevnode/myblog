import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationsBell } from "@/components/notifications/notifications-bell";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b-2 border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-heading text-2xl font-bold">
          MyBlog
        </Link>
        <nav className="flex items-center gap-2">
          <Button size="sm" render={<Link href="/explore" />}>
            Explore
          </Button>
          {user ? (
            <>
              <Button size="sm" render={<Link href="/write" />}>
                Write
              </Button>
              <NotificationsBell uid={user.uid} />
              {user.role === "admin" && (
                <Button size="sm" render={<Link href="/admin" />}>
                  Admin
                </Button>
              )}
              <SignOutButton />
            </>
          ) : (
            <Button size="sm" variant="solid" render={<Link href="/login" />}>
              Sign in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
