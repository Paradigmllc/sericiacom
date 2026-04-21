import Link from "next/link";
import { ReactNode } from "react";

export function Container({ children, className = "", size = "default" }: { children: ReactNode; className?: string; size?: "narrow" | "default" | "wide" }) {
  const widths = { narrow: "max-w-2xl", default: "max-w-5xl", wide: "max-w-[1440px]" };
  return <div className={`${widths[size]} mx-auto px-6 md:px-12 ${className}`}>{children}</div>;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`label ${className}`}>{children}</p>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] tracking-[0.22em] uppercase font-medium text-sericia-accent mb-5">{children}</p>;
}

export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-t border-sericia-line ${className}`} />;
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "solid" | "outline" | "link";
  size?: "default" | "large";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
};

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "solid",
  size = "default",
  disabled = false,
  className = "",
  fullWidth = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = {
    default: "px-8 py-3 text-[13px]",
    large: "px-10 py-4 text-[14px]",
  };
  const variants = {
    solid: "bg-sericia-ink text-sericia-paper hover:bg-sericia-accent",
    outline: "border border-sericia-ink text-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper",
    link: "border-b border-sericia-ink text-sericia-ink hover:text-sericia-accent hover:border-sericia-accent py-0 px-0",
  };
  const width = fullWidth ? "w-full" : "";
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${width} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

export function SectionHeading({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <div className="mb-16">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-[36px] md:text-[44px] leading-[1.15] font-normal tracking-tight max-w-3xl">{title}</h2>
      {lede && <p className="mt-5 text-[17px] text-sericia-ink-soft max-w-prose leading-relaxed">{lede}</p>}
    </div>
  );
}

export function StatBlock({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div>
      <div className="text-[28px] md:text-[32px] font-normal leading-none mb-2">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function PageHero({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <section className="border-b border-sericia-line">
      <Container className="py-24 md:py-32">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-[44px] md:text-[60px] leading-[1.08] font-normal tracking-tight max-w-4xl">{title}</h1>
        {lede && <p className="mt-8 text-[18px] md:text-[19px] text-sericia-ink-soft max-w-prose leading-relaxed">{lede}</p>}
      </Container>
    </section>
  );
}
