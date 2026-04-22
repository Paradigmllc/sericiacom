-- Push subscriptions for the Sericia PWA (2026-04-22)
--
-- Why a single table serves both authenticated and anonymous subscribers:
-- the most valuable push targets (cart abandon, drop alert, back-in-stock)
-- fire for pre-auth visitors too. Splitting users vs. anons across two
-- tables doubles the n8n query surface for no win.
--
-- One of (user_id, visitor_hash) must be set. Enforced by a CHECK below.
-- `endpoint` is the natural unique key from the Web Push API — two browsers
-- on the same device get distinct endpoints, so we key dedup on that, not
-- on user_id.

create table if not exists sericia_push_subscriptions (
  id bigserial primary key,

  -- Auth link (nullable). Set when the subscriber signed in when they opted
  -- in. Kept nullable so anonymous drop-alert subscribers are first-class.
  user_id uuid references auth.users(id) on delete cascade,

  -- Anonymous visitor identifier — a hash of a long-lived cookie set by the
  -- middleware. Lets us deduplicate when the same anon visitor reinstalls
  -- the PWA on a new device without revealing PII to downstream n8n steps.
  visitor_hash text,

  -- Web Push subscription payload (from PushSubscription.toJSON()).
  -- `endpoint` is globally unique per browser profile × site and therefore
  -- the natural conflict target for upsert.
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,

  -- Context at opt-in — useful for segmenting campaigns later.
  user_agent text,
  locale text,
  country_code text,
  topics text[] not null default array['drops','orders']::text[],

  -- Lifecycle.
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,

  constraint push_subscriptions_owner_present
    check (user_id is not null or visitor_hash is not null)
);

create index if not exists idx_push_subs_user on sericia_push_subscriptions(user_id)
  where user_id is not null and revoked_at is null;

create index if not exists idx_push_subs_visitor on sericia_push_subscriptions(visitor_hash)
  where visitor_hash is not null and revoked_at is null;

create index if not exists idx_push_subs_topics on sericia_push_subscriptions using gin(topics)
  where revoked_at is null;

alter table sericia_push_subscriptions enable row level security;

-- RLS: a logged-in user can see their own subscriptions (useful for the
-- /account/notifications management UI). All writes go through the service
-- role via /api/push/* so no insert/update/delete policies needed here.
drop policy if exists "push_subs_select_own" on sericia_push_subscriptions;
create policy "push_subs_select_own"
  on sericia_push_subscriptions for select
  using (auth.uid() = user_id);

-- Automatically bump last_seen_at on any update.
create or replace function sericia_push_subs_touch()
returns trigger language plpgsql as $$
begin
  new.last_seen_at := now();
  return new;
end;
$$;

drop trigger if exists trg_push_subs_touch on sericia_push_subscriptions;
create trigger trg_push_subs_touch
  before update on sericia_push_subscriptions
  for each row execute function sericia_push_subs_touch();
