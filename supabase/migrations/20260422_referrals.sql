-- ---------------------------------------------------------------------------
-- Sericia referral program — $10 OFF for referee, $10 credit for referrer.
-- ---------------------------------------------------------------------------
-- Design:
--   • One code per user (auth.users.id is UNIQUE on sericia_referral_codes)
--   • Codes are human-readable: {PREFIX}-{4-char}. Prefix comes from the
--     user's display name or falls back to SEN. Entropy lives in the 4-char
--     suffix (base32-ish without confusable chars).
--   • Redemptions are a separate log table so a single code can be redeemed
--     many times (unless redemption_limit is set).
--   • Discounts/rewards are stored as USD integers (dollars), matching the
--     sericia_orders.amount_usd convention.
--   • RLS: owner-reads-own for codes + redemptions; service_role writes.
--     Validation (public, for checkout field) goes through an RPC that
--     exposes ONLY the minimum: {valid, discount_amount_usd, referrer_first_name}.
-- ---------------------------------------------------------------------------

create table if not exists sericia_referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  code text unique not null,
  referrer_display_name text,          -- snapshot, so rename doesn't break old redemptions
  discount_amount_usd integer not null default 10,
  referrer_reward_usd integer not null default 10,
  is_active boolean not null default true,
  redemption_count integer not null default 0,
  redemption_limit integer,            -- null = unlimited
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_codes_user on sericia_referral_codes(user_id);
create unique index if not exists idx_referral_codes_email_lower on sericia_referral_codes(lower(email));

-- Every time someone checks out with a referral code, one row is written here.
-- Reward issuance flips reward_status from pending → issued (or revoked if the
-- order is later cancelled / refunded).
create table if not exists sericia_referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references sericia_referral_codes(id) on delete restrict,
  referrer_user_id uuid references auth.users(id) on delete set null,
  referrer_email text not null,
  referee_email text not null,
  order_id uuid references sericia_orders(id) on delete set null,
  discount_applied_usd integer not null,
  reward_issued_usd integer not null,
  reward_status text not null default 'pending',  -- pending | issued | revoked
  created_at timestamptz not null default now(),
  issued_at timestamptz,
  unique (code_id, order_id)
);

create index if not exists idx_redemptions_referrer on sericia_referral_redemptions(referrer_user_id);
create index if not exists idx_redemptions_order on sericia_referral_redemptions(order_id);
create index if not exists idx_redemptions_status on sericia_referral_redemptions(reward_status);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table sericia_referral_codes enable row level security;
alter table sericia_referral_redemptions enable row level security;

-- Codes — owner reads their own, service_role full access.
drop policy if exists "referral_codes_owner_select" on sericia_referral_codes;
create policy "referral_codes_owner_select"
  on sericia_referral_codes for select
  using (auth.uid() = user_id);

drop policy if exists "referral_codes_service_all" on sericia_referral_codes;
create policy "referral_codes_service_all"
  on sericia_referral_codes for all
  using (auth.role() = 'service_role');

-- Redemptions — referrer sees their own earnings, service_role writes.
drop policy if exists "referral_redemptions_owner_select" on sericia_referral_redemptions;
create policy "referral_redemptions_owner_select"
  on sericia_referral_redemptions for select
  using (auth.uid() = referrer_user_id);

drop policy if exists "referral_redemptions_service_all" on sericia_referral_redemptions;
create policy "referral_redemptions_service_all"
  on sericia_referral_redemptions for all
  using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Public validation RPC
-- ---------------------------------------------------------------------------
-- Exposed via PostgREST so the checkout field can validate codes without
-- needing service_role. Returns a minimal payload — NEVER leak the referrer's
-- email, user_id, or internal counters.
--
-- SECURITY DEFINER: function runs as the function owner (postgres), bypassing
-- RLS. This is OK because we hand-curate exactly which columns are returned
-- and never echo back PII.
create or replace function sericia_validate_referral_code(input_code text)
returns table (
  valid boolean,
  discount_amount_usd integer,
  referrer_first_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  row_found sericia_referral_codes%rowtype;
begin
  select * into row_found
  from sericia_referral_codes
  where code = upper(trim(input_code))
    and is_active = true
    and (redemption_limit is null or redemption_count < redemption_limit)
  limit 1;

  if not found then
    return query select false, 0, null::text;
    return;
  end if;

  return query select
    true,
    row_found.discount_amount_usd,
    split_part(coalesce(row_found.referrer_display_name, ''), ' ', 1);
end;
$$;

-- Allow anon + authenticated to call the validator.
grant execute on function sericia_validate_referral_code(text) to anon, authenticated;
