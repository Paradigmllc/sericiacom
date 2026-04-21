"use client";
import { useEffect } from "react";
import posthog from "posthog-js";

export default function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === "undefined") return;
    if ((posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
    });
    (posthog as unknown as { __loaded?: boolean }).__loaded = true;
  }, []);
  return null;
}
