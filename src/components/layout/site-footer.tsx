import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xl font-bold">BlogGen</p>
          <p className="mt-1 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sanjeev Singh. All rights reserved.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href="https://github.com/sanjeevnode"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:bg-primary hover:text-primary-foreground"
          >
            GitHub
          </a>
          <a
            href="https://sanjeevnode.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:bg-primary hover:text-primary-foreground"
          >
            sanjeevnode.in
          </a>
          <Link
            href="/explore"
            className="underline underline-offset-4 hover:bg-primary hover:text-primary-foreground"
          >
            Explore
          </Link>
        </nav>
      </div>
    </footer>
  );
}
