import { HeaderSkeleton, PostCardSkeleton, Skeleton } from "@/components/ds/skeleton";

export default function FeedLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-10 w-56" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <PostCardSkeleton />
          <PostCardSkeleton withImage={false} />
          <PostCardSkeleton withImage={false} />
          <PostCardSkeleton />
        </div>
      </main>
    </>
  );
}
