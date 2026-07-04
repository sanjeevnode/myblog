import { HeaderSkeleton, Skeleton } from "@/components/ds/skeleton";

export default function AdminLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-10 w-72" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full border-2 border-border" />
          ))}
        </div>
        <Skeleton className="mt-10 h-64 w-full border-2 border-border" />
        <Skeleton className="mt-10 h-64 w-full border-2 border-border" />
      </main>
    </>
  );
}
