import type { Metadata } from "next";
import ReferralsClient from "./ReferralsClient";

export const metadata: Metadata = {
  title: "Referrals — Sericia",
  description:
    "Invite a friend to Sericia. They get $10 off their first drop. You get $10 when they order.",
};

export const dynamic = "force-dynamic";

export default function ReferralsPage() {
  return <ReferralsClient />;
}
