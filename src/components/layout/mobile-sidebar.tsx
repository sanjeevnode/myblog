"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function MobileSidebar({
  signedIn,
  isAdmin,
}: {
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation and lock body scroll while open
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass =
    "block border-b-2 border-border px-4 py-3 text-lg font-bold hover:bg-primary hover:text-primary-foreground";

  return (
    <div className="md:hidden">
      <Button size="sm" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-primary/40"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-l-2 border-border bg-background">
            <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
              <span className="font-heading text-xl font-bold">Menu</span>
              <Button size="sm" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <Link href="/" className={linkClass}>
                Home
              </Link>
              <Link href="/explore" className={linkClass}>
                Explore
              </Link>
              {signedIn && (
                <Link href="/write" className={linkClass}>
                  Write
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className={linkClass}>
                  Admin
                </Link>
              )}
              {!signedIn && (
                <Link href="/login" className={linkClass}>
                  Sign in
                </Link>
              )}
            </nav>
            {signedIn && (
              <div className="border-t-2 border-border p-4">
                <SignOutButton />
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
