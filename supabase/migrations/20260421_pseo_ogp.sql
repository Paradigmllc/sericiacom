-- Add OGP image URL + index for Rakuten sourced candidates
alter table sericia_pseo add column if not exists ogp_url text;

-- Candidates table for L1/L2/L3 scrapers (Rakuten API, Crawlee, Crawl4AI)
create table if not exists sericia_candidates (
  id bigserial primary key,
  source text not null,
  external_url text unique not null,
  title text not null,
  price_jpy integer,
  expiry_date text,
  image_url text,
  shop_name text,
  raw_data jsonb,
  scraped_at timestamptz default now(),
  reviewed boolean default false,
  rejected boolean default false
);

create index if not exists idx_candidates_source on sericia_candidates(source);
create index if not exists idx_candidates_scraped_at on sericia_candidates(scraped_at desc);
create index if not exists idx_candidates_reviewed on sericia_candidates(reviewed, rejected);

alter table sericia_candidates enable row level security;
create policy "candidates_service_only" on sericia_candidates for all using (auth.role() = 'service_role');
