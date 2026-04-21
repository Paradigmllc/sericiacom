-- Sericia commerce: drops, orders, waitlist, analytics events
create table if not exists sericia_drops (
  id text primary key,
  title text not null,
  story text not null,
  price_usd integer not null,
  weight_g integer not null,
  total_units integer not null,
  sold_units integer not null default 0,
  ships_within_hours integer not null default 48,
  status text not null default 'active',
  released_at timestamptz not null default now(),
  closes_at timestamptz,
  hero_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists sericia_orders (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null references sericia_drops(id),
  status text not null default 'pending',
  email text not null,
  full_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country_code text not null,
  phone text,
  quantity integer not null default 1,
  amount_usd integer not null,
  currency text not null default 'USD',
  crossmint_order_id text unique,
  tx_hash text,
  tracking_number text,
  tracking_carrier text,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  ip_country text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_drop on sericia_orders(drop_id);
create index if not exists idx_orders_email on sericia_orders(email);
create index if not exists idx_orders_status on sericia_orders(status);
create index if not exists idx_orders_crossmint on sericia_orders(crossmint_order_id);

create table if not exists sericia_waitlist (
  id bigserial primary key,
  email text unique not null,
  country_code text,
  locale text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  confirmed boolean default false,
  unsubscribed boolean default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_waitlist_created on sericia_waitlist(created_at desc);

create table if not exists sericia_events (
  id bigserial primary key,
  event_name text not null,
  distinct_id text,
  drop_id text,
  order_id uuid,
  country_code text,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  properties jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_name on sericia_events(event_name);
create index if not exists idx_events_created on sericia_events(created_at desc);

alter table sericia_drops enable row level security;
alter table sericia_orders enable row level security;
alter table sericia_waitlist enable row level security;
alter table sericia_events enable row level security;

drop policy if exists "drops_public_read" on sericia_drops;
create policy "drops_public_read" on sericia_drops for select using (status = 'active');

drop policy if exists "drops_service_all" on sericia_drops;
create policy "drops_service_all" on sericia_drops for all using (auth.role() = 'service_role');

drop policy if exists "orders_service_only" on sericia_orders;
create policy "orders_service_only" on sericia_orders for all using (auth.role() = 'service_role');

drop policy if exists "waitlist_service_only" on sericia_waitlist;
create policy "waitlist_service_only" on sericia_waitlist for all using (auth.role() = 'service_role');

drop policy if exists "events_service_only" on sericia_events;
create policy "events_service_only" on sericia_events for all using (auth.role() = 'service_role');

-- Seed drop-001
insert into sericia_drops (id, title, story, price_usd, weight_g, total_units, ships_within_hours)
values (
  'drop-001',
  'Drop #1 — Sencha × Miso × Dried Shiitake',
  'Three small Japanese producers had 480g of surplus on their hands — craft sencha near peak, barrel-aged miso, and hand-dried shiitake. Rescued before disposal. Same quality. Half the waste.',
  95, 480, 50, 48
)
on conflict (id) do nothing;
