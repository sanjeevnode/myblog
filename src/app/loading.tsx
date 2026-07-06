import { HeaderSkeleton, PostCardSkeleton, Skeleton } from "@/components/ds/skeleton";

export default function FeedLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-10 w-56" />
        {/* Mirrors the masonry columns: two independent stacks of natural-height cards */}
        <div className="mt-8 flex gap-6">
          <div className="min-w-0 flex-1 space-y-6">
            <PostCardSkeleton />
            <PostCardSkeleton withImage={false} />
          </div>
          <div className="hidden min-w-0 flex-1 space-y-6 sm:block">
            <PostCardSkeleton withImage={false} />
            <PostCardSkeleton />
          </div>
        </div>
      </main>
    </>
  );
}
