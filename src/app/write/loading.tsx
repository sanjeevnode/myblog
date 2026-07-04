import { HeaderSkeleton, Skeleton } from "@/components/ds/skeleton";

export default function WriteLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="aspect-[3/1] w-full border-2 border-dashed border-border" />
        <Skeleton className="mt-6 h-12 w-3/4" />
        <Skeleton className="mt-6 h-96 w-full border-2 border-border" />
      </main>
    </>
  );
}
