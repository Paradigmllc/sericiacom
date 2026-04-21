import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <main className="min-h-screen bg-sericia-paper text-sericia-ink flex items-center justify-center p-6">
      <div className="max-w-lg bg-white rounded-2xl border border-sericia-ink/10 p-10 text-center">
        <p className="text-sericia-accent uppercase tracking-[0.2em] text-xs mb-4">Order confirmed</p>
        <h1 className="text-3xl font-serif mb-4">Thank you for rescuing Japan&apos;s craft food.</h1>
        <p className="text-sericia-ink/70 mb-2">
          We&apos;ve sent a confirmation to your email. Your drop ships from Japan within 48 hours with EMS tracking.
        </p>
        {order && <p className="text-xs text-sericia-ink/50 font-mono mb-6">Order {order}</p>}
        <p className="text-sm text-sericia-ink/70 mb-8">
          Next drop arrives in ~2 weeks. Watch your inbox for the early-access email.
        </p>
        <Link href="/guides" className="inline-block underline text-sericia-accent">
          Browse country shipping guides →
        </Link>
      </div>
    </main>
  );
}
