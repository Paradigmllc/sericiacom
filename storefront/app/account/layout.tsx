import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AccountNav from "@/components/AccountNav";
import { Container } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <Container size="wide" className="py-16 md:py-24">
        <div className="grid md:grid-cols-12 gap-12 md:gap-20">
          <aside className="md:col-span-3">
            <AccountNav />
          </aside>
          <div className="md:col-span-9">{children}</div>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
