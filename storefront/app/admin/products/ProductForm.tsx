"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CATEGORIES = ["tea", "miso", "mushroom", "seasoning", "other"] as const;
const STATUSES = ["active", "draft", "sold_out"] as const;

type ProductFormValue = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  story: string;
  price_usd: number;
  weight_g: number;
  stock: number;
  category: string;
  images: string[];
  origin_region: string | null;
  producer_name: string | null;
  status: string;
};

export default function ProductForm({ initial }: { initial?: Partial<ProductFormValue> }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValue>({
    id: initial?.id,
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    story: initial?.story ?? "",
    price_usd: initial?.price_usd ?? 0,
    weight_g: initial?.weight_g ?? 0,
    stock: initial?.stock ?? 0,
    category: initial?.category ?? "tea",
    images: initial?.images ?? [],
    origin_region: initial?.origin_region ?? "",
    producer_name: initial?.producer_name ?? "",
    status: initial?.status ?? "active",
  });
  const [imagesText, setImagesText] = useState((initial?.images ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const images = imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const payload = { ...v, images };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      toast.success(v.id ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/products/save] failed", err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function softDelete() {
    if (!v.id) return;
    if (typeof window !== "undefined" && !window.confirm("Move this product to draft status?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${v.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Moved to draft");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/products/delete] failed", err);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  const input =
    "w-full border-0 border-b border-sericia-line bg-transparent py-2 text-[14px] focus:outline-none focus:border-sericia-ink";
  const textarea =
    "w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[14px] focus:outline-none focus:border-sericia-ink";

  return (
    <form onSubmit={submit} className="border border-sericia-line bg-sericia-paper-card p-8 space-y-6 max-w-3xl">
      <div>
        <label className="label block mb-2">Name</label>
        <input
          type="text"
          required
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
          className={input}
        />
      </div>
      <div>
        <label className="label block mb-2">Slug</label>
        <input
          type="text"
          required
          value={v.slug}
          onChange={(e) => setV({ ...v, slug: e.target.value })}
          className={input}
          placeholder="sencha-yamane-en"
        />
      </div>
      <div>
        <label className="label block mb-2">Description</label>
        <textarea
          rows={3}
          value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value })}
          className={textarea}
        />
      </div>
      <div>
        <label className="label block mb-2">Story</label>
        <textarea
          rows={5}
          value={v.story}
          onChange={(e) => setV({ ...v, story: e.target.value })}
          className={textarea}
        />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="label block mb-2">Price USD</label>
          <input
            type="number"
            step="0.01"
            required
            value={v.price_usd}
            onChange={(e) => setV({ ...v, price_usd: parseFloat(e.target.value) || 0 })}
            className={input}
          />
        </div>
        <div>
          <label className="label block mb-2">Weight (g)</label>
          <input
            type="number"
            required
            value={v.weight_g}
            onChange={(e) => setV({ ...v, weight_g: parseInt(e.target.value) || 0 })}
            className={input}
          />
        </div>
        <div>
          <label className="label block mb-2">Stock</label>
          <input
            type="number"
            required
            value={v.stock}
            onChange={(e) => setV({ ...v, stock: parseInt(e.target.value) || 0 })}
            className={input}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="label block mb-2">Category</label>
          <select
            value={v.category}
            onChange={(e) => setV({ ...v, category: e.target.value })}
            className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[14px] focus:outline-none focus:border-sericia-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label block mb-2">Status</label>
          <select
            value={v.status}
            onChange={(e) => setV({ ...v, status: e.target.value })}
            className="w-full border border-sericia-line bg-sericia-paper py-2 px-3 text-[14px] focus:outline-none focus:border-sericia-ink"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="label block mb-2">Origin region</label>
          <input
            type="text"
            value={v.origin_region ?? ""}
            onChange={(e) => setV({ ...v, origin_region: e.target.value })}
            className={input}
          />
        </div>
        <div>
          <label className="label block mb-2">Producer name</label>
          <input
            type="text"
            value={v.producer_name ?? ""}
            onChange={(e) => setV({ ...v, producer_name: e.target.value })}
            className={input}
          />
        </div>
      </div>
      <div>
        <label className="label block mb-2">Image URLs (one per line)</label>
        <textarea
          rows={4}
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          className={textarea}
          placeholder="https://…/img1.jpg"
        />
      </div>
      <div className="flex gap-4 pt-4 border-t border-sericia-line">
        <button
          type="submit"
          disabled={saving}
          className="bg-sericia-ink text-sericia-paper py-3 px-6 text-[13px] tracking-wider hover:bg-sericia-accent transition disabled:opacity-40"
        >
          {saving ? "Saving…" : v.id ? "Save changes" : "Create product"}
        </button>
        {v.id && (
          <button
            type="button"
            onClick={softDelete}
            disabled={deleting}
            className="border border-red-700 text-red-700 py-3 px-6 text-[13px] tracking-wider hover:bg-red-700 hover:text-sericia-paper transition disabled:opacity-40"
          >
            {deleting ? "Removing…" : "Move to draft"}
          </button>
        )}
      </div>
    </form>
  );
}
