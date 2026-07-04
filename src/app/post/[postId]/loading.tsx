import { HeaderSkeleton, Skeleton } from "@/components/ds/skeleton";

export default function PostLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="border-2 border-border shadow-panel">
          <Skeleton className="aspect-[2/1] w-full border-b-2 border-border" />
          <div className="space-y-4 p-6 sm:p-10">
            <Skeleton className="h-10 w-11/12" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-3 pt-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={i % 4 === 3 ? "h-4 w-2/3" : "h-4 w-full"} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
