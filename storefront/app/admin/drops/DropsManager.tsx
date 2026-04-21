"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type DropRow = {
  id: string;
  title: string;
  story: string;
  price_usd: number;
  weight_g: number;
  total_units: number;
  sold_units: number;
  ships_within_hours: number;
  status: string;
  released_at: string | null;
  closes_at: string | null;
  hero_image_url: string | null;
};

type Props = { initial: DropRow[] };

const STATUSES = ["active", "upcoming", "sold_out", "archived"] as const;

export default function DropsManager({ initial }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<DropRow> | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(row: Partial<DropRow>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      toast.success("Drop saved");
      setEditing(null);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/drops] save failed", err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function close(id: string) {
    if (!window.confirm("Close this drop? It will no longer be purchasable.")) return;
    try {
      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "sold_out" }),
      });
      if (!res.ok) throw new Error("Close failed");
      toast.success("Drop closed");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/drops] close failed", err);
      toast.error(msg);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-[13px] text-sericia-ink-soft">{initial.length} drops</div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: "",
              story: "",
              price_usd: 95,
              weight_g: 480,
              total_units: 50,
              sold_units: 0,
              ships_within_hours: 48,
              status: "upcoming",
              released_at: new Date().toISOString(),
              closes_at: null,
              hero_image_url: "",
            })
          }
          className="bg-sericia-ink text-sericia-paper py-2 px-4 text-[13px] tracking-wider hover:bg-sericia-accent transition"
        >
          + New drop
        </button>
      </div>

      <div className="space-y-4">
        {initial.length === 0 && (
          <div className="border border-sericia-line bg-sericia-paper-card p-10 text-center text-sericia-ink-mute">
            No drops yet.
          </div>
        )}
        {initial.map((d) => {
          const pct = d.total_units > 0 ? Math.min(100, (d.sold_units / d.total_units) * 100) : 0;
          return (
            <article key={d.id} className="border border-sericia-line bg-sericia-paper-card p-6">
              <div className="flex items-start justify-between gap-6 mb-4">
                <div>
                  <div className="label mb-1">{d.status}</div>
                  <h3 className="text-[18px] font-normal">{d.title}</h3>
                  <p className="text-[12px] text-sericia-ink-soft font-mono mt-1">{d.id}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(d)}
                    className="border border-sericia-line py-1.5 px-3 text-[12px] hover:bg-sericia-paper"
                  >
                    Edit
                  </button>
                  {d.status !== "sold_out" && (
                    <button
                      type="button"
                      onClick={() => close(d.id)}
                      className="border border-red-700 text-red-700 py-1.5 px-3 text-[12px] hover:bg-red-700 hover:text-sericia-paper"
                    >
                      Close drop
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-[13px] mb-3">
                <div>
                  <div className="label mb-1">Price</div>
                  <div>${d.price_usd}</div>
                </div>
                <div>
                  <div className="label mb-1">Weight</div>
                  <div>{d.weight_g}g</div>
                </div>
                <div>
                  <div className="label mb-1">Sold</div>
                  <div>
                    {d.sold_units} / {d.total_units}
                  </div>
                </div>
                <div>
                  <div className="label mb-1">Ships within</div>
                  <div>{d.ships_within_hours}h</div>
                </div>
              </div>
              <div className="h-1 bg-sericia-paper border border-sericia-line relative">
                <div className="absolute inset-y-0 left-0 bg-sericia-ink" style={{ width: `${pct}%` }} />
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-sericia-ink/50 flex items-center justify-center z-50 p-6">
          <div className="bg-sericia-paper-card border border-sericia-line max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-5 border-b border-sericia-line flex items-center justify-between">
              <h3 className="text-[16px]">{editing.id ? "Edit drop" : "New drop"}</h3>
              <button onClick={() => setEditing(null)} className="text-sericia-ink-mute hover:text-sericia-ink">
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editing) return;
                save(editing);
              }}
              className="p-8 space-y-5"
            >
              <Field
                label="Title"
                value={editing.title ?? ""}
                onChange={(v) => setEditing({ ...editing, title: v })}
              />
              <div>
                <label className="label block mb-2">Story</label>
                <textarea
                  rows={4}
                  value={editing.story ?? ""}
                  onChange={(e) => setEditing({ ...editing, story: e.target.value })}
                  className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[14px] focus:outline-none focus:border-sericia-ink"
                />
              </div>
              <div className="grid grid-cols-3 gap-5">
                <Field
                  label="Price USD"
                  type="number"
                  value={String(editing.price_usd ?? 0)}
                  onChange={(v) => setEditing({ ...editing, price_usd: parseFloat(v) || 0 })}
                />
                <Field
                  label="Weight g"
                  type="number"
                  value={String(editing.weight_g ?? 0)}
                  onChange={(v) => setEditing({ ...editing, weight_g: parseInt(v) || 0 })}
                />
                <Field
                  label="Ships within (h)"
                  type="number"
                  value={String(editing.ships_within_hours ?? 0)}
                  onChange={(v) => setEditing({ ...editing, ships_within_hours: parseInt(v) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Field
                  label="Total units"
                  type="number"
                  value={String(editing.total_units ?? 0)}
                  onChange={(v) => setEditing({ ...editing, total_units: parseInt(v) || 0 })}
                />
                <Field
                  label="Sold units"
                  type="number"
                  value={String(editing.sold_units ?? 0)}
                  onChange={(v) => setEditing({ ...editing, sold_units: parseInt(v) || 0 })}
                />
              </div>
              <div>
                <label className="label block mb-2">Status</label>
                <select
                  value={editing.status ?? "upcoming"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[14px] focus:outline-none focus:border-sericia-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Hero image URL"
                value={editing.hero_image_url ?? ""}
                onChange={(v) => setEditing({ ...editing, hero_image_url: v })}
              />
              <div className="flex gap-3 pt-4 border-t border-sericia-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-sericia-ink text-sericia-paper py-2.5 px-5 text-[13px] tracking-wider hover:bg-sericia-accent transition disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="border border-sericia-line py-2.5 px-5 text-[13px] tracking-wider hover:bg-sericia-paper transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 border-b border-sericia-line bg-transparent py-2 text-[14px] focus:outline-none focus:border-sericia-ink"
      />
    </div>
  );
}
