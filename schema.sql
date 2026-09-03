-- ============================================================
-- TECHNO-MARKET — Supabase PostgreSQL Schema
-- Copy and paste this entire file into the Supabase SQL Editor
-- and press "Run". It is safe to run multiple times (idempotent).
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─────────────────────────────────────────────
-- 1. TEAMS  (fully dynamic — any number of teams)
-- ─────────────────────────────────────────────
create table if not exists public.teams (
  id            uuid primary key default uuid_generate_v4(),
  team_number   integer unique not null,          -- e.g. 1, 2, 3 …  (auto-assigned on registration)
  team_name     text not null,                    -- e.g. "Team 01"  or a custom name
  purse         integer not null default 100000,  -- Starting budget in ₹ (edit to change default)
  is_active     boolean not null default true,    -- soft-delete / disable a team without removing data
  created_at    timestamptz not null default now()
);

comment on table public.teams is
  'Dynamic team registry. New teams are added here by the auctioneer before or during the event.';

comment on column public.teams.purse is
  'Remaining budget in ₹. Decremented on each successful bid. Default ₹1,00,000 — change per event.';


-- ─────────────────────────────────────────────
-- 2. TECHNOLOGIES
-- ─────────────────────────────────────────────
create table if not exists public.technologies (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,
  category        text not null check (category in ('A', 'B')),
  is_golden       boolean not null default false,  -- only meaningful for category A
  is_sold         boolean not null default false,
  sold_to_team_id uuid references public.teams(id) on delete set null,
  sold_price      integer,                          -- winning bid amount
  display_order   integer,                          -- auctioneer can reorder if needed
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint golden_only_in_category_a
    check (is_golden = false or category = 'A')
);

comment on table public.technologies is
  'All 24 auctionable technologies. Category A = Core (12), Category B = Support (12).';


-- ─────────────────────────────────────────────
-- 3. EVENT STATE  (singleton row — always id = 1)
-- ─────────────────────────────────────────────
create table if not exists public.event_state (
  id                      integer primary key default 1,  -- always exactly one row
  phase                   text not null default 'NOT_STARTED'
                            check (phase in (
                              'NOT_STARTED',
                              'CATEGORY_A',
                              'CATEGORY_B',
                              'GOLDEN_POWER',
                              'COMPLETE'
                            )),
  current_technology_id   uuid references public.technologies(id) on delete set null,
  started_at              timestamptz,
  category_b_started_at   timestamptz,
  completed_at            timestamptz,
  updated_at              timestamptz not null default now(),

  constraint singleton check (id = 1)
);

comment on table public.event_state is
  'Singleton row that drives the auction state machine. Never insert a second row.';


-- ─────────────────────────────────────────────
-- 4. TRANSACTIONS  (bid history, editable)
-- ─────────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  technology_id   uuid not null references public.technologies(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  bid_amount      integer not null check (bid_amount > 0),
  phase           text not null check (phase in ('A', 'B')),  -- which category phase this occurred in
  is_voided       boolean not null default false,              -- auctioneer can void/undo a transaction
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.transactions is
  'Immutable log of all bids. Use is_voided = true to undo rather than deleting rows.';


-- ─────────────────────────────────────────────
-- 5. GOLDEN SWAPS  (post-auction Cat-B swaps)
-- ─────────────────────────────────────────────
create table if not exists public.golden_swaps (
  id                  uuid primary key default uuid_generate_v4(),

  -- The team that owns the golden technology
  golden_team_id      uuid not null references public.teams(id) on delete cascade,
  golden_tech_id      uuid not null references public.technologies(id),   -- the golden core tech (for reference)

  -- The Cat-B technology the golden team gives away
  initiating_tech_id  uuid not null references public.technologies(id),

  -- The other team involved
  receiving_team_id   uuid not null references public.teams(id) on delete cascade,

  -- The Cat-B technology the golden team receives
  receiving_tech_id   uuid not null references public.technologies(id),

  is_reversed         boolean not null default false,  -- auctioneer can undo the swap
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Enforce: no team swapping with itself, no same-tech swap
  constraint no_self_swap check (golden_team_id <> receiving_team_id),
  constraint no_same_tech_swap check (initiating_tech_id <> receiving_tech_id)
);

comment on table public.golden_swaps is
  'Records every Category-B swap triggered by a Golden Power. Reversible.';


-- ─────────────────────────────────────────────
-- 6. PRESENTATION ORDERS  (golden teams only)
-- ─────────────────────────────────────────────
create table if not exists public.presentation_orders (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null unique references public.teams(id) on delete cascade,
  position    integer not null check (position between 1 and 3),  -- 1=First, 2=Middle, 3=Last
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint unique_position unique (position)
);

comment on table public.presentation_orders is
  'Optional presentation order assignment for golden-technology teams. Max 3 positions.';


-- ─────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to every table that has updated_at
do $$
declare
  t text;
begin
  foreach t in array array[
    'technologies', 'event_state', 'transactions', 'golden_swaps', 'presentation_orders'
  ] loop
    execute format(
      'drop trigger if exists trg_%I_updated_at on public.%I;
       create trigger trg_%I_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at();',
      t, t, t, t
    );
  end loop;
end;
$$;


-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.teams               enable row level security;
alter table public.technologies        enable row level security;
alter table public.event_state         enable row level security;
alter table public.transactions        enable row level security;
alter table public.golden_swaps        enable row level security;
alter table public.presentation_orders enable row level security;

-- ── TEAMS ──
drop policy if exists "teams_read" on public.teams;
drop policy if exists "teams_admin_write" on public.teams;
create policy "teams_open"
  on public.teams for all
  to anon
  using (true)
  with check (true);

-- ── TECHNOLOGIES ──
drop policy if exists "technologies_read" on public.technologies;
drop policy if exists "technologies_admin_write" on public.technologies;
create policy "technologies_open"
  on public.technologies for all
  to anon
  using (true)
  with check (true);

-- ── EVENT STATE ──
drop policy if exists "event_state_read" on public.event_state;
drop policy if exists "event_state_admin_write" on public.event_state;
create policy "event_state_open"
  on public.event_state for all
  to anon
  using (true)
  with check (true);

-- ── TRANSACTIONS ──
drop policy if exists "transactions_read" on public.transactions;
drop policy if exists "transactions_admin_write" on public.transactions;
create policy "transactions_open"
  on public.transactions for all
  to anon
  using (true)
  with check (true);

-- ── GOLDEN SWAPS ──
drop policy if exists "golden_swaps_read" on public.golden_swaps;
drop policy if exists "golden_swaps_admin_write" on public.golden_swaps;
create policy "golden_swaps_open"
  on public.golden_swaps for all
  to anon
  using (true)
  with check (true);

-- ── PRESENTATION ORDERS ──
drop policy if exists "presentation_orders_read" on public.presentation_orders;
drop policy if exists "presentation_orders_admin_write" on public.presentation_orders;
create policy "presentation_orders_open"
  on public.presentation_orders for all
  to anon
  using (true)
  with check (true);


-- ─────────────────────────────────────────────
-- SUPABASE REALTIME  (subscribe to all tables)
-- ─────────────────────────────────────────────
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.teams,
    public.technologies,
    public.event_state,
    public.transactions,
    public.golden_swaps,
    public.presentation_orders;
commit;


-- ─────────────────────────────────────────────
-- SEED — EVENT STATE  (exactly one row)
-- ─────────────────────────────────────────────
insert into public.event_state (id, phase)
values (1, 'NOT_STARTED')
on conflict (id) do nothing;


-- ─────────────────────────────────────────────
-- SEED — CATEGORY A  (12 Core Technologies)
-- ─────────────────────────────────────────────
insert into public.technologies (name, category, is_golden, display_order) values
  ('Computer Vision',                    'A', true,   1),
  ('Digital Twin & Simulation',          'A', true,   2),
  ('AR / VR & Immersive Systems',        'A', true,   3),
  ('Geospatial Intelligence',            'A', false,  4),
  ('Optimization & Decision Systems',    'A', false,  5),
  ('Edge Computing',                     'A', false,  6),
  ('AI / Machine Learning',              'A', false,  7),
  ('IoT & Sensor Systems',               'A', false,  8),
  ('Robotics & Autonomous Systems',      'A', false,  9),
  ('Predictive & Recommendation Systems','A', false, 10),
  ('Blockchain & Decentralized Systems', 'A', false, 11),
  ('Human-Computer Interaction',         'A', false, 12)
on conflict (name) do update set display_order = excluded.display_order, is_golden = excluded.is_golden;




-- ─────────────────────────────────────────────
-- SEED — CATEGORY B  (12 Support Technologies)
-- ─────────────────────────────────────────────
insert into public.technologies (name, category, is_golden, display_order) values
  ('Database & Data Storage',      'B', false, 13),
  ('API & External Integrations',  'B', false, 14),
  ('Cloud Infrastructure',         'B', false, 15),
  ('Cybersecurity',                'B', false, 16),
  ('Authentication & Identity',    'B', false, 17),
  ('Voice Interface',              'B', false, 18),
  ('Notification & Communication', 'B', false, 19),
  ('Payment & Transaction System', 'B', false, 20),
  ('Real-Time Communication',      'B', false, 21),
  ('Analytics & Visualization',    'B', false, 22),
  ('Workflow & Automation',        'B', false, 23),
  ('UI/UX & Prototyping',          'B', false, 24)
on conflict (name) do nothing;


-- ─────────────────────────────────────────────
-- RPC FUNCTION: ASSIGN TECHNOLOGY
-- (Performs all updates in a single ACID transaction)
-- ─────────────────────────────────────────────
create or replace function public.assign_technology(
  p_technology_id uuid,
  p_team_id uuid,
  p_bid_amount integer,
  p_phase text
)
returns void
language plpgsql
security invoker
as $$
declare
  v_team_purse integer;
begin
  -- 1. Get and verify the team's purse
  select purse into v_team_purse from public.teams where id = p_team_id;
  if v_team_purse is null then
    raise exception 'Team not found';
  end if;
  if v_team_purse < p_bid_amount then
    raise exception 'Insufficient purse budget';
  end if;

  -- 2. Deduct bid amount from team's purse
  update public.teams
  set purse = purse - p_bid_amount
  where id = p_team_id;

  -- 3. Mark technology as sold
  update public.technologies
  set is_sold = true,
      sold_to_team_id = p_team_id,
      sold_price = p_bid_amount
  where id = p_technology_id;

  -- 4. Insert transaction record
  insert into public.transactions (technology_id, team_id, bid_amount, phase)
  values (p_technology_id, p_team_id, p_bid_amount, p_phase);

  -- 5. Clear current technology in event state
  update public.event_state
  set current_technology_id = null
  where id = 1;
end;
$$;


-- ─────────────────────────────────────────────
-- HELPER VIEW — current auction snapshot
-- ─────────────────────────────────────────────
create or replace view public.auction_snapshot as
select
  es.phase,
  es.updated_at  as state_updated_at,
  t.id           as current_tech_id,
  t.name         as current_tech_name,
  t.category     as current_tech_category,
  t.is_golden    as current_tech_is_golden,
  (select count(*) from public.technologies where category = 'A' and is_sold = true)  as cat_a_sold,
  (select count(*) from public.technologies where category = 'A')                     as cat_a_total,
  (select count(*) from public.technologies where category = 'B' and is_sold = true)  as cat_b_sold,
  (select count(*) from public.technologies where category = 'B')                     as cat_b_total
from public.event_state es
left join public.technologies t on t.id = es.current_technology_id
where es.id = 1;

comment on view public.auction_snapshot is
  'One-shot read of the live auction state. Subscribe to event_state realtime for updates.';


-- ─────────────────────────────────────────────
-- DONE ✅
-- Tables:   teams, technologies, event_state,
--           transactions, golden_swaps, presentation_orders
-- Realtime: enabled on all tables
-- RLS:      read = all authenticated, write = admin only
-- Seed:     24 technologies + event_state singleton
-- ─────────────────────────────────────────────
