import { HeaderSkeleton, PostCardSkeleton, Skeleton } from "@/components/ds/skeleton";

export default function ExploreLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="mt-6 h-9 w-full" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="mt-8 flex gap-6">
          <div className="min-w-0 flex-1 space-y-6">
            <PostCardSkeleton withImage={false} />
          </div>
          <div className="hidden min-w-0 flex-1 sm:block">
            <PostCardSkeleton />
          </div>
        </div>
      </main>
    </>
  );
}
