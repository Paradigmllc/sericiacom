import { cn } from "@/lib/cn";
import { ReactNode } from "react";

/**
 * Magic UI Bento Grid — featured asymmetric grid for use-case showcases.
 *
 * Adapted from magicui.design/r/bento-grid (MIT). Sericia tuning:
 *   - Border colour from sericia tokens
 *   - Card hover: subtle -translate-y-0.5 (no flashy lift)
 *   - Server component compatible (pure JSX, no hooks)
 *
 * Usage:
 *   <BentoGrid>
 *     <BentoCard size="2x1" title="..." description="..." />
 *     <BentoCard size="1x1" title="..." />
 *   </BentoGrid>
 */

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  /** Layout size: "1x1" (1col 1row) | "2x1" (2col) | "1x2" (2row) */
  size?: "1x1" | "2x1" | "1x2";
  name: string;
  description?: string;
  background?: ReactNode;
  cta?: ReactNode;
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<BentoCardProps["size"]>, string> = {
  "1x1": "md:col-span-1",
  "2x1": "md:col-span-2",
  "1x2": "md:row-span-2",
};

export function BentoCard({
  size = "1x1",
  name,
  description,
  background,
  cta,
  className,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative col-span-1 flex flex-col justify-end overflow-hidden rounded-sm border border-sericia-line bg-sericia-paper-card transition-transform hover:-translate-y-0.5",
        SIZE_CLASS[size],
        className,
      )}
    >
      {background ? (
        <div className="absolute inset-0 -z-10 opacity-90 group-hover:opacity-100 transition-opacity">
          {background}
        </div>
      ) : null}
      <div className="p-6 md:p-8 z-10">
        <h3 className="text-[20px] md:text-[24px] font-normal tracking-tight text-sericia-ink">
          {name}
        </h3>
        {description ? (
          <p className="mt-2 text-[14px] md:text-[15px] text-sericia-ink-soft leading-relaxed">
            {description}
          </p>
        ) : null}
        {cta ? <div className="mt-4">{cta}</div> : null}
      </div>
    </div>
  );
}

export default BentoGrid;
