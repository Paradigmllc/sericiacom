/**
 * Lightweight class-name concatenator. F44 added because the new
 * components/magicui/* set imports `cn` from `@/lib/cn` per the
 * Magic UI / shadcn convention. We don't already have one — Sericia
 * components have used template-literal class strings until now.
 *
 * No clsx/tailwind-merge dependency: the codebase is small enough that
 * naive string concat with falsy filtering covers every existing call
 * site. If we ever need conditional Tailwind class deduplication
 * (e.g. `cn("px-4", "px-2")` should keep the latter), add
 * `tailwind-merge` and replace this implementation.
 */

type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) out.push(inner);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(" ");
}
