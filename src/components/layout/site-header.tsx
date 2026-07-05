import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-heading text-2xl font-bold">
          MyBlog
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
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

        {/* Mobile: bell stays visible, everything else in the sidebar */}
        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationsBell uid={user.uid} />}
          <MobileSidebar signedIn={!!user} isAdmin={user?.role === "admin"} />
        </div>
      </div>
    </header>
  );
}
