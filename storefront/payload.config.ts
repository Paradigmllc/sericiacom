import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  LinkFeature,
  UploadFeature,
  AlignFeature,
  BlockquoteFeature,
  ChecklistFeature,
  HorizontalRuleFeature,
  OrderedListFeature,
  UnorderedListFeature,
  IndentFeature,
} from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Articles } from "./collections/Articles";
import { Guides } from "./collections/Guides";
import { Tools } from "./collections/Tools";
import { Media } from "./collections/Media";
import { Testimonials } from "./collections/Testimonials";
import { PressMentions } from "./collections/PressMentions";

import { SiteSettings } from "./globals/SiteSettings";
import { Homepage } from "./globals/Homepage";
import { PaymentSettings } from "./globals/PaymentSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Build-time guard: Payload requires DATABASE_URL_PAYLOAD at runtime for DB ops,
// but at build time we only need a syntactically-valid connection string so the
// adapter initialises. Use a dummy if not provided so `next build` can succeed.
const databaseUrl =
  process.env.DATABASE_URL_PAYLOAD ||
  "postgres://dummy:dummy@localhost:5432/dummy";

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " — Sericia CMS",
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      InlineToolbarFeature(),
      FixedToolbarFeature(),
      HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
      LinkFeature({ enabledCollections: ["articles", "guides", "tools"] }),
      UploadFeature({
        collections: {
          media: {
            fields: [
              { name: "caption", type: "text", localized: true },
            ],
          },
        },
      }),
      AlignFeature(),
      BlockquoteFeature(),
      ChecklistFeature(),
      HorizontalRuleFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      IndentFeature(),
    ],
  }),
  collections: [Users, Articles, Guides, Tools, Media, Testimonials, PressMentions],
  globals: [SiteSettings, Homepage, PaymentSettings],
  routes: {
    admin: "/cms/admin",
    api: "/cms/api",
    graphQL: "/cms/api/graphql",
    graphQLPlayground: "/cms/api/graphql-playground",
  },
  localization: {
    locales: [
      { code: "en", label: "English" },
      { code: "ja", label: "日本語" },
      { code: "de", label: "Deutsch" },
      { code: "fr", label: "Français" },
      { code: "es", label: "Español" },
      { code: "it", label: "Italiano" },
      { code: "ko", label: "한국어" },
      { code: "zh-TW", label: "繁體中文" },
      { code: "ru", label: "Русский" },
      { code: "ar", label: "العربية", rtl: true },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || "DEV_ONLY_PAYLOAD_SECRET_CHANGE_ME",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
    },
    schemaName: "payload",
    push: false,
  }),
  plugins: [
    s3Storage({
      enabled:
        !!process.env.SUPABASE_S3_ENDPOINT &&
        !!process.env.SUPABASE_S3_ACCESS_KEY_ID &&
        !!process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
      collections: {
        media: {
          prefix: "media",
          disableLocalStorage: true,
        },
      },
      bucket: process.env.SUPABASE_S3_BUCKET || "sericia-media",
      config: {
        endpoint: process.env.SUPABASE_S3_ENDPOINT || "",
        region: process.env.SUPABASE_S3_REGION || "ap-northeast-1",
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
        },
        forcePathStyle: true, // required for Supabase S3-compat
      },
    }),
  ],
  sharp,
  graphQL: {
    disablePlaygroundInProduction: false,
  },
});
