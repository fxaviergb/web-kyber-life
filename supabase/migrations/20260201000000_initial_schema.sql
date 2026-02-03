-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  first_name text,
  last_name text,
  default_currency_code text default 'USD',
  image text,
  bio text,
  country text,
  province text,
  city text,
  parish text,
  neighborhood text,
  primary_street text,
  secondary_street text,
  address_reference text,
  postal_code text,
  socials jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 2. MARKET: SUPERMARKETS
create table public.market_supermarkets (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 3. MARKET: CATEGORIES
create table public.market_categories (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade, -- Nullable for system categories
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 4. MARKET: UNITS
create table public.market_units (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade, -- Nullable for system units
  name text not null,
  symbol text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 5. MARKET: GENERIC ITEMS (Global/Shared potential, but currently owned)
create table public.market_generic_items (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade not null,
  canonical_name text not null,
  aliases text[], -- Array of strings
  primary_category_id uuid references public.market_categories(id) on delete set null,
  secondary_category_ids uuid[], -- Array of UUIDs
  image_url text,
  global_price numeric,
  currency_code text default 'USD',
  last_price_update timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 6. MARKET: BRAND PRODUCTS
create table public.market_brand_products (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade not null,
  generic_item_id uuid references public.market_generic_items(id) on delete cascade not null,
  brand text not null,
  presentation text,
  image_url text,
  global_price numeric,
  currency_code text default 'USD',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 7. MARKET: TEMPLATES (Shopping Lists)
create table public.market_templates (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 8. MARKET: TEMPLATE ITEMS
create table public.market_template_items (
  id uuid default uuid_generate_v4() primary key,
  template_id uuid references public.market_templates(id) on delete cascade not null,
  generic_item_id uuid references public.market_generic_items(id) on delete cascade not null,
  default_qty numeric,
  default_unit_id uuid references public.market_units(id) on delete set null,
  sort_order integer default 0
);

-- 9. MARKET: PURCHASES
create table public.market_purchases (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade not null,
  supermarket_id uuid references public.market_supermarkets(id) on delete set null,
  date timestamptz not null,
  currency_code text default 'USD',
  selected_template_ids uuid[],
  total_paid numeric,
  subtotal numeric,
  discount numeric,
  tax numeric,
  status text not null check (status in ('draft', 'completed')),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 10. MARKET: PURCHASE LINES
create table public.market_purchase_lines (
  id uuid default uuid_generate_v4() primary key,
  purchase_id uuid references public.market_purchases(id) on delete cascade not null,
  generic_item_id uuid references public.market_generic_items(id) on delete cascade not null,
  brand_product_id uuid references public.market_brand_products(id) on delete set null,
  qty numeric,
  unit_id uuid references public.market_units(id) on delete set null,
  unit_price numeric,
  checked boolean default false,
  line_amount_override numeric,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- 11. MARKET: PRICE OBSERVATIONS
create table public.market_price_observations (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references public.profiles(id) on delete cascade not null,
  brand_product_id uuid references public.market_brand_products(id) on delete cascade not null,
  supermarket_id uuid references public.market_supermarkets(id) on delete cascade not null,
  currency_code text default 'USD',
  unit_price numeric,
  observed_at timestamptz default now(),
  source_purchase_id uuid references public.market_purchases(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table market_supermarkets enable row level security;
alter table market_categories enable row level security;
alter table market_units enable row level security;
alter table market_generic_items enable row level security;
alter table market_brand_products enable row level security;
alter table market_templates enable row level security;
alter table market_template_items enable row level security;
alter table market_purchases enable row level security;
alter table market_purchase_lines enable row level security;
alter table market_price_observations enable row level security;

-- PROFILES: Users can see/edit their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- MARKET TABLES: Users can only see their own data
-- Supermarkets
create policy "Users can manage own supermarkets" on market_supermarkets for all using (auth.uid() = owner_user_id);

-- Categories (Custom logic: Own OR System (owner_user_id is null))
create policy "Users can view own and system categories" on market_categories for select using (auth.uid() = owner_user_id or owner_user_id is null);
create policy "Users can manage own categories" on market_categories for all using (auth.uid() = owner_user_id);

-- Units
create policy "Users can view own and system units" on market_units for select using (auth.uid() = owner_user_id or owner_user_id is null);
create policy "Users can manage own units" on market_units for all using (auth.uid() = owner_user_id);

-- Generic Items
create policy "Users can manage own generic items" on market_generic_items for all using (auth.uid() = owner_user_id);

-- Brand Products
create policy "Users can manage own brand products" on market_brand_products for all using (auth.uid() = owner_user_id);

-- Templates
create policy "Users can manage own templates" on market_templates for all using (auth.uid() = owner_user_id);

-- Template Items (Linked via Template)
create policy "Users can manage own template items" on market_template_items for all using (
  exists (select 1 from market_templates t where t.id = market_template_items.template_id and t.owner_user_id = auth.uid())
);

-- Purchases
create policy "Users can manage own purchases" on market_purchases for all using (auth.uid() = owner_user_id);

-- Purchase Lines (Linked via Purchase)
create policy "Users can manage own purchase lines" on market_purchase_lines for all using (
  exists (select 1 from market_purchases p where p.id = market_purchase_lines.purchase_id and p.owner_user_id = auth.uid())
);

-- Price Observations
create policy "Users can manage own observations" on market_price_observations for all using (auth.uid() = owner_user_id);

-- FUNCTION: Handle New User -> Create Profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: Create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
