import { Suspense } from "react";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Login — Sericia",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-sericia-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-sericia-line bg-sericia-paper-card p-10">
        <div className="label mb-2">Sericia</div>
        <h1 className="text-[24px] font-normal tracking-tight mb-8">Admin access</h1>
        <Suspense fallback={<div className="text-[13px] text-sericia-ink-soft">Loading…</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
