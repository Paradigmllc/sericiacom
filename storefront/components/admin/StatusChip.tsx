export default function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "text-sericia-ink-mute border-sericia-line",
    paid: "text-sericia-accent border-sericia-accent",
    shipped: "text-sericia-ink border-sericia-ink",
    delivered: "text-sericia-ink border-sericia-ink",
    refunded: "text-red-700 border-red-700",
    cancelled: "text-red-700 border-red-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase border ${
        map[status] || "text-sericia-ink-mute border-sericia-line"
      }`}
    >
      {status}
    </span>
  );
}
