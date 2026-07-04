import { cn } from "@/lib/utils";

/**
 * Primary content container: 2px black border with the reference design's hard
 * bottom/right shadow. Use sparingly — post cards and the main article panel only.
 */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border-2 border-border bg-background shadow-panel", className)}>
      {children}
    </div>
  );
}
