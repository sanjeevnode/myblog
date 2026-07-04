import { cn } from "@/lib/utils";

/**
 * Boxed-number treatment from the reference design: a small square black-bordered
 * box with a number, and a bold heading beside it. Used for dashboard stat blocks
 * and labeled sections.
 */
export function SectionNumber({
  number,
  title,
  className,
  children,
}: {
  number: number | string;
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center border-2 border-border font-heading text-sm font-bold">
        {number}
      </span>
      <div>
        <h3 className="text-lg font-bold leading-8">{title}</h3>
        {children}
      </div>
    </div>
  );
}
