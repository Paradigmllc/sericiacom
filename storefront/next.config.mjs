import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_CROSSMINT_CLIENT_ID: process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_ID,
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default withNextIntl(nextConfig);
