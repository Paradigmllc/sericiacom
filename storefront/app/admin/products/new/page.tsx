import AdminShell from "@/components/AdminShell";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Product — Sericia Admin", robots: { index: false, follow: false } };

export default function NewProductPage() {
  return (
    <AdminShell title="New product">
      <ProductForm />
    </AdminShell>
  );
}
