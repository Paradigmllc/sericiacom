-- Sericia products catalog + cart-based orders + profiles
-- Adds: sericia_products, sericia_order_items, sericia_profiles
-- Adds column: sericia_orders.order_type
-- RLS + auth triggers

create table if not exists sericia_products (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  story text not null,
  price_usd integer not null,
  weight_g integer not null,
  stock integer not null default 0,
  category text not null,
  images jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  origin_region text,
  producer_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_status on sericia_products(status);
create index if not exists idx_products_category on sericia_products(category);
create index if not exists idx_products_slug on sericia_products(slug);

alter table sericia_orders add column if not exists order_type text not null default 'cart';
alter table sericia_orders alter column drop_id drop not null;

create table if not exists sericia_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references sericia_orders(id) on delete cascade,
  product_id text not null references sericia_products(id),
  quantity integer not null,
  unit_price_usd integer not null,
  product_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order on sericia_order_items(order_id);
create index if not exists idx_order_items_product on sericia_order_items(product_id);

create table if not exists sericia_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  default_address jsonb,
  phone text,
  locale text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_email on sericia_profiles(email);

-- RLS
alter table sericia_products enable row level security;
alter table sericia_order_items enable row level security;
alter table sericia_profiles enable row level security;

drop policy if exists "products_public_read" on sericia_products;
create policy "products_public_read" on sericia_products for select using (status = 'active');

drop policy if exists "products_service_all" on sericia_products;
create policy "products_service_all" on sericia_products for all using (auth.role() = 'service_role');

drop policy if exists "order_items_service_only" on sericia_order_items;
create policy "order_items_service_only" on sericia_order_items for all using (auth.role() = 'service_role');

drop policy if exists "profiles_self_read" on sericia_profiles;
create policy "profiles_self_read" on sericia_profiles for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on sericia_profiles;
create policy "profiles_self_update" on sericia_profiles for update using (auth.uid() = id);

drop policy if exists "profiles_service_all" on sericia_profiles;
create policy "profiles_service_all" on sericia_profiles for all using (auth.role() = 'service_role');

-- Auto-create profile on signup
create or replace function sericia_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into sericia_profiles (id, email, full_name, locale)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists sericia_on_auth_user_created on auth.users;
create trigger sericia_on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure sericia_handle_new_user();

-- Seed products
insert into sericia_products (id, slug, name, description, story, price_usd, weight_g, stock, category, origin_region, producer_name)
values
  ('prod-sencha-uji-001', 'sencha-uji-first-flush', 'Sencha — Uji First Flush',
   'First-flush single-origin sencha, shaded 12 days before harvest. Vivid green, concentrated umami, clean finish.',
   'Small family farm in Uji, Kyoto. The first flush of the season from trees grown in gentle shade for twelve days, concentrating chlorophyll and theanine. Steamed, rolled, and dried the same day it is picked. What you taste is sunlight filtered through bamboo mats.',
   42, 100, 80, 'tea', 'Kyoto / Uji', 'Nakamura-en'),
  ('prod-matcha-uji-001', 'matcha-ceremonial-uji', 'Matcha — Ceremonial Grade Uji',
   'Stone-milled ceremonial grade from 80-year-old trees. Bright jade colour, no bitterness, long finish.',
   'Tencha leaves from hand-picked plants tended by the same family for three generations. Stone-milled at 30g per hour — the only way to avoid heat damage to the pigments. Mixed with 80°C water it blooms into a bright jade suspension with almost no grind on the palate.',
   68, 30, 60, 'tea', 'Kyoto / Uji', 'Nakamura-en'),
  ('prod-miso-hatcho-001', 'miso-hatcho-3yr', 'Hatcho Miso — 3-Year Barrel Aged',
   'Soy-only miso aged three years in cedar barrels under granite stones. Dense, almost chocolatey, deeply savoury.',
   'Made in Okazaki, Aichi by one of only two remaining makers using the original Edo-period method: pure soybean koji, sea salt, no rice or barley, compressed in two-tonne cedar barrels under stacked river stones for three full years. The resulting miso is almost black, dense as fudge, and tastes of umami concentrated to the edge of sweetness.',
   38, 500, 40, 'miso', 'Aichi / Okazaki', 'Maruya Hatcho'),
  ('prod-miso-shiro-001', 'miso-shiro-kyoto', 'Shiro Miso — Kyoto White',
   'Four-week Kyoto shiro miso, sweet and pale. High rice-koji ratio, gentle on the salt.',
   'The counterpoint to hatcho: pale, sweet, ready in just four weeks. A Kyoto speciality built on a huge ratio of rice koji to soybeans, with less salt and a shorter fermentation. Stir a spoonful into dashi and it dissolves to a creamy ivory soup with none of the bite of a red miso.',
   24, 500, 50, 'miso', 'Kyoto', 'Honda Miso'),
  ('prod-shiitake-donko-001', 'shiitake-donko-dried', 'Donko Shiitake — Sun-Dried',
   'Sun-dried donko-grade shiitake from winter harvest. Thick cap, deep curl, intense dashi when rehydrated.',
   'Donko are the thick, half-opened caps harvested in winter before the mushroom flattens out. Grown on cut oak logs in the Oita hills and dried slowly in the sun rather than in machine kilns. A single cap reconstitutes in warm water to something close to steak in texture, and the soaking liquid makes a dashi that needs nothing else.',
   34, 80, 70, 'mushroom', 'Oita', 'Sato Kinoko'),
  ('prod-yuzu-kosho-001', 'yuzu-kosho-green', 'Green Yuzu Kosho',
   'Hand-crushed green yuzu peel, green chilli, and salt. Small-batch fermentation.',
   'Three ingredients: green yuzu peel from the Kochi highlands, young green chillies from the same farm, and sea salt. Hand-crushed in small wooden tubs and left to ferment for three weeks. Electric in citrus, slow in heat, and built to be the final brushstroke on grilled fish or a bowl of hot udon.',
   22, 60, 90, 'seasoning', 'Kochi', 'Mikata Citrus')
on conflict (id) do nothing;
