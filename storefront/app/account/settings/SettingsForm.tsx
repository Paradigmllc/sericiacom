"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SettingsForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  const input = "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const label = "label block mb-2";

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const { error } = await supabaseBrowser().auth.updateUser({ email: email.toLowerCase().trim() });
      if (error) throw error;
      toast.success("Email change requested. Check both inboxes to confirm.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[settings] email", err);
      toast.error(msg);
    } finally {
      setLoadingEmail(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoadingPwd(true);
    try {
      const { error } = await supabaseBrowser().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      toast.success("Password updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[settings] password", err);
      toast.error(msg);
    } finally {
      setLoadingPwd(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirmDelete !== "DELETE") {
      toast.error('Type DELETE to confirm');
      return;
    }
    setLoadingDelete(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "delete_failed");
      }
      await supabaseBrowser().auth.signOut();
      toast.success("Account deleted");
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[settings] delete", err);
      toast.error(msg);
      setLoadingDelete(false);
    }
  }

  return (
    <div className="space-y-16 max-w-xl">
      <form onSubmit={updateEmail} className="space-y-5">
        <h2 className="text-[22px] font-normal">Email</h2>
        <div>
          <label className={label}>Email address</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
        </div>
        <button type="submit" disabled={loadingEmail}
          className="bg-sericia-ink text-sericia-paper py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loadingEmail ? "Sending…" : "Update email"}
        </button>
      </form>

      <form onSubmit={updatePassword} className="space-y-5">
        <h2 className="text-[22px] font-normal">Password</h2>
        <div>
          <label className={label}>New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete="new-password" minLength={8} placeholder="Minimum 8 characters" />
        </div>
        <button type="submit" disabled={loadingPwd || !password}
          className="bg-sericia-ink text-sericia-paper py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loadingPwd ? "Updating…" : "Update password"}
        </button>
      </form>

      <form onSubmit={deleteAccount} className="space-y-5 border border-sericia-line p-8">
        <h2 className="text-[22px] font-normal">Delete account</h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          Permanently delete your profile and addresses. Orders are retained for legal and tax reasons.
          This cannot be undone.
        </p>
        <div>
          <label className={label}>Type DELETE to confirm</label>
          <input type="text" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className={input} />
        </div>
        <button type="submit" disabled={loadingDelete || confirmDelete !== "DELETE"}
          className="border border-sericia-ink py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-ink hover:text-sericia-paper transition-colors disabled:opacity-40">
          {loadingDelete ? "Deleting…" : "Delete account"}
        </button>
      </form>
    </div>
  );
}
