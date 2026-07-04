import { cn } from "@/lib/utils";

/** Grayscale pulse block matching the editorial style (sharp corners). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-secondary", className)} />;
}

export function PostCardSkeleton({ withImage = true }: { withImage?: boolean }) {
  return (
    <div className="border-2 border-border">
      {withImage && <Skeleton className="aspect-[2/1] w-full border-b-2 border-border" />}
      <div className="space-y-3 p-6">
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="border-b-2 border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-heading text-2xl font-bold">MyBlog</span>
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}
