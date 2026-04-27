import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_site_settings_region_banners_region_code" AS ENUM('jp', 'us', 'eu', 'gb', 'ca', 'au', 'sg', 'hk', 'me');
  CREATE TABLE "payload"."site_settings_footer_copy_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"external" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."site_settings_footer_copy_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_footer_copy_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_footer_copy_columns_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_navigation_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"highlighted" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."site_settings_navigation_items_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_region_banners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region_code" "payload"."enum_site_settings_region_banners_region_code" NOT NULL,
  	"url" varchar,
  	"enabled" boolean DEFAULT true
  );
  
  CREATE TABLE "payload"."site_settings_region_banners_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_homepage_copy_makers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_homepage_copy_makers_items_locales" (
  	"craft" varchar NOT NULL,
  	"region" varchar NOT NULL,
  	"note" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_homepage_copy_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_homepage_copy_how_it_works_steps_locales" (
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_homepage_copy_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_homepage_copy_faq_items_locales" (
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "payload"."site_settings" ADD COLUMN "coupon_banner_enabled" boolean DEFAULT true;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "coupon_banner_code" varchar DEFAULT 'SERICIA10';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "coupon_banner_storage_key_version" varchar DEFAULT 'v1';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "homepage_copy_faq_cta_url" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "footer_copy_editorial_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "footer_copy_editorial_heading" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "footer_copy_editorial_body" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "footer_copy_subscribe_privacy_note" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "footer_copy_studio_copy" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "footer_copy_currently_viewing_label" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "coupon_banner_headline" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "coupon_banner_offer_text" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "coupon_banner_with_code_prefix" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_current_drop_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_current_drop_title" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_current_drop_lede" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_featured_bundle_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_most_loved_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_most_loved_title" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_makers_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_makers_title" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_makers_lede" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_philosophy_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_philosophy_body" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_waitlist_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_waitlist_title" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_waitlist_body" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_waitlist_footnote" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_how_it_works_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_how_it_works_title" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_faq_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_faq_title" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "homepage_copy_faq_cta_label" varchar;
  ALTER TABLE "payload"."site_settings_footer_copy_columns_links" ADD CONSTRAINT "site_settings_footer_copy_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_footer_copy_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_copy_columns_links_locales" ADD CONSTRAINT "site_settings_footer_copy_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_footer_copy_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_copy_columns" ADD CONSTRAINT "site_settings_footer_copy_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_copy_columns_locales" ADD CONSTRAINT "site_settings_footer_copy_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_footer_copy_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_navigation_items" ADD CONSTRAINT "site_settings_navigation_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_navigation_items_locales" ADD CONSTRAINT "site_settings_navigation_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_navigation_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_region_banners" ADD CONSTRAINT "site_settings_region_banners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_region_banners_locales" ADD CONSTRAINT "site_settings_region_banners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_region_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_homepage_copy_makers_items" ADD CONSTRAINT "site_settings_homepage_copy_makers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_homepage_copy_makers_items_locales" ADD CONSTRAINT "site_settings_homepage_copy_makers_items_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_homepage_copy_makers_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_homepage_copy_how_it_works_steps" ADD CONSTRAINT "site_settings_homepage_copy_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_homepage_copy_how_it_works_steps_locales" ADD CONSTRAINT "site_settings_homepage_copy_how_it_works_steps_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_homepage_copy_how_it_works_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_homepage_copy_faq_items" ADD CONSTRAINT "site_settings_homepage_copy_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_homepage_copy_faq_items_locales" ADD CONSTRAINT "site_settings_homepage_copy_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_homepage_copy_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_footer_copy_columns_links_order_idx" ON "payload"."site_settings_footer_copy_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_copy_columns_links_parent_id_idx" ON "payload"."site_settings_footer_copy_columns_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_footer_copy_columns_links_locales_locale_paren" ON "payload"."site_settings_footer_copy_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_footer_copy_columns_order_idx" ON "payload"."site_settings_footer_copy_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_copy_columns_parent_id_idx" ON "payload"."site_settings_footer_copy_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_footer_copy_columns_locales_locale_parent_id_u" ON "payload"."site_settings_footer_copy_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_navigation_items_order_idx" ON "payload"."site_settings_navigation_items" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_items_parent_id_idx" ON "payload"."site_settings_navigation_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_navigation_items_locales_locale_parent_id_uniq" ON "payload"."site_settings_navigation_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_region_banners_order_idx" ON "payload"."site_settings_region_banners" USING btree ("_order");
  CREATE INDEX "site_settings_region_banners_parent_id_idx" ON "payload"."site_settings_region_banners" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_region_banners_locales_locale_parent_id_unique" ON "payload"."site_settings_region_banners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_homepage_copy_makers_items_order_idx" ON "payload"."site_settings_homepage_copy_makers_items" USING btree ("_order");
  CREATE INDEX "site_settings_homepage_copy_makers_items_parent_id_idx" ON "payload"."site_settings_homepage_copy_makers_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_homepage_copy_makers_items_locales_locale_pare" ON "payload"."site_settings_homepage_copy_makers_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_homepage_copy_how_it_works_steps_order_idx" ON "payload"."site_settings_homepage_copy_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "site_settings_homepage_copy_how_it_works_steps_parent_id_idx" ON "payload"."site_settings_homepage_copy_how_it_works_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_homepage_copy_how_it_works_steps_locales_local" ON "payload"."site_settings_homepage_copy_how_it_works_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_homepage_copy_faq_items_order_idx" ON "payload"."site_settings_homepage_copy_faq_items" USING btree ("_order");
  CREATE INDEX "site_settings_homepage_copy_faq_items_parent_id_idx" ON "payload"."site_settings_homepage_copy_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_homepage_copy_faq_items_locales_locale_parent_" ON "payload"."site_settings_homepage_copy_faq_items_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_settings_footer_copy_columns_links" CASCADE;
  DROP TABLE "payload"."site_settings_footer_copy_columns_links_locales" CASCADE;
  DROP TABLE "payload"."site_settings_footer_copy_columns" CASCADE;
  DROP TABLE "payload"."site_settings_footer_copy_columns_locales" CASCADE;
  DROP TABLE "payload"."site_settings_navigation_items" CASCADE;
  DROP TABLE "payload"."site_settings_navigation_items_locales" CASCADE;
  DROP TABLE "payload"."site_settings_region_banners" CASCADE;
  DROP TABLE "payload"."site_settings_region_banners_locales" CASCADE;
  DROP TABLE "payload"."site_settings_homepage_copy_makers_items" CASCADE;
  DROP TABLE "payload"."site_settings_homepage_copy_makers_items_locales" CASCADE;
  DROP TABLE "payload"."site_settings_homepage_copy_how_it_works_steps" CASCADE;
  DROP TABLE "payload"."site_settings_homepage_copy_how_it_works_steps_locales" CASCADE;
  DROP TABLE "payload"."site_settings_homepage_copy_faq_items" CASCADE;
  DROP TABLE "payload"."site_settings_homepage_copy_faq_items_locales" CASCADE;
  ALTER TABLE "payload"."site_settings" DROP COLUMN "coupon_banner_enabled";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "coupon_banner_code";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "coupon_banner_storage_key_version";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "homepage_copy_faq_cta_url";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "footer_copy_editorial_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "footer_copy_editorial_heading";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "footer_copy_editorial_body";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "footer_copy_subscribe_privacy_note";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "footer_copy_studio_copy";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "footer_copy_currently_viewing_label";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "coupon_banner_headline";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "coupon_banner_offer_text";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "coupon_banner_with_code_prefix";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_current_drop_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_current_drop_title";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_current_drop_lede";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_featured_bundle_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_most_loved_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_most_loved_title";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_makers_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_makers_title";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_makers_lede";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_philosophy_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_philosophy_body";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_waitlist_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_waitlist_title";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_waitlist_body";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_waitlist_footnote";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_how_it_works_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_how_it_works_title";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_faq_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_faq_title";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "homepage_copy_faq_cta_label";
  DROP TYPE "payload"."enum_site_settings_region_banners_region_code";`)
}
