import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."site_settings_hero_copy_typewriter_strings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_hero_copy_typewriter_strings_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_hero_copy_meta_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_hero_copy_meta_lines_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_announcement_bar_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link" varchar
  );
  
  CREATE TABLE "payload"."site_settings_announcement_bar_items_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "announcement_bar_enabled" SET DEFAULT true;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "hero_poster_url" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "hero_copy_primary_cta_url" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "hero_copy_secondary_cta_url" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "announcement_bar_scroll_speed_seconds" numeric DEFAULT 40;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "hero_copy_eyebrow" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "hero_copy_headline_line1" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "hero_copy_headline_line2" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "hero_copy_body" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "hero_copy_primary_cta_label" varchar;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "hero_copy_secondary_cta_label" varchar;
  ALTER TABLE "payload"."site_settings_hero_copy_typewriter_strings" ADD CONSTRAINT "site_settings_hero_copy_typewriter_strings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_hero_copy_typewriter_strings_locales" ADD CONSTRAINT "site_settings_hero_copy_typewriter_strings_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_hero_copy_typewriter_strings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_hero_copy_meta_lines" ADD CONSTRAINT "site_settings_hero_copy_meta_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_hero_copy_meta_lines_locales" ADD CONSTRAINT "site_settings_hero_copy_meta_lines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_hero_copy_meta_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_announcement_bar_items" ADD CONSTRAINT "site_settings_announcement_bar_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_announcement_bar_items_locales" ADD CONSTRAINT "site_settings_announcement_bar_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_announcement_bar_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_hero_copy_typewriter_strings_order_idx" ON "payload"."site_settings_hero_copy_typewriter_strings" USING btree ("_order");
  CREATE INDEX "site_settings_hero_copy_typewriter_strings_parent_id_idx" ON "payload"."site_settings_hero_copy_typewriter_strings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_hero_copy_typewriter_strings_locales_locale_pa" ON "payload"."site_settings_hero_copy_typewriter_strings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_hero_copy_meta_lines_order_idx" ON "payload"."site_settings_hero_copy_meta_lines" USING btree ("_order");
  CREATE INDEX "site_settings_hero_copy_meta_lines_parent_id_idx" ON "payload"."site_settings_hero_copy_meta_lines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_hero_copy_meta_lines_locales_locale_parent_id_" ON "payload"."site_settings_hero_copy_meta_lines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_announcement_bar_items_order_idx" ON "payload"."site_settings_announcement_bar_items" USING btree ("_order");
  CREATE INDEX "site_settings_announcement_bar_items_parent_id_idx" ON "payload"."site_settings_announcement_bar_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_announcement_bar_items_locales_locale_parent_i" ON "payload"."site_settings_announcement_bar_items_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings_hero_copy_typewriter_strings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_settings_hero_copy_typewriter_strings_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_settings_hero_copy_meta_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_settings_hero_copy_meta_lines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_settings_announcement_bar_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_settings_announcement_bar_items_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."site_settings_hero_copy_typewriter_strings" CASCADE;
  DROP TABLE "payload"."site_settings_hero_copy_typewriter_strings_locales" CASCADE;
  DROP TABLE "payload"."site_settings_hero_copy_meta_lines" CASCADE;
  DROP TABLE "payload"."site_settings_hero_copy_meta_lines_locales" CASCADE;
  DROP TABLE "payload"."site_settings_announcement_bar_items" CASCADE;
  DROP TABLE "payload"."site_settings_announcement_bar_items_locales" CASCADE;
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "announcement_bar_enabled" SET DEFAULT false;
  ALTER TABLE "payload"."site_settings" DROP COLUMN "hero_poster_url";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "hero_copy_primary_cta_url";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "hero_copy_secondary_cta_url";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "announcement_bar_scroll_speed_seconds";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "hero_copy_eyebrow";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "hero_copy_headline_line1";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "hero_copy_headline_line2";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "hero_copy_body";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "hero_copy_primary_cta_label";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "hero_copy_secondary_cta_label";`)
}
