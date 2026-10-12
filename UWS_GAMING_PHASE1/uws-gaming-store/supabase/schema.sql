-- Run in Supabase SQL editor. All customer records are private by default.
create extension if not exists pgcrypto;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 2 and 200),
 category text not null check (category in ('game','software')),
 description text not null default '',
 price_cents integer not null check(price_cents>=0),
 image_emoji text not null default '🎮',
 badge text not null default 'DIGITAL',
 delivery_mode text not null default 'manual' check(delivery_mode in ('manual','automatic')),
 stock integer check(stock is null or stock>=0),
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number text not null unique,
 customer_name text not null,
 customer_email text not null,
 customer_notes text not null default '',
 total_cents integer not null check(total_cents>=0),
 currency text not null default 'MYR' check(currency='MYR'),
 payment_status text not null default 'unpaid' check(payment_status in ('unpaid','paid','refunded')),
 fulfillment_status text not null default 'pending' check(fulfillment_status in ('pending','processing','fulfilled')),
 created_at timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 product_id uuid references public.products(id) on delete set null,
 product_name text not null,
 quantity integer not null check(quantity between 1 and 10),
 unit_price_cents integer not null check(unit_price_cents>=0)
);
create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_products_category on public.products(category);
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;
-- Read public catalog through anon key. Service role bypasses RLS, and must NEVER be placed in client code.
drop policy if exists "public active product read" on public.products;
create policy "public active product read" on public.products for select to anon,authenticated using(active=true);
-- No anon read/write of orders, items or admin identities. Order creation happens server-side.
-- Admin API authenticates with getUser, then verifies admin_users server-side.
-- Add example products (original/demo placeholders only; replace prior to accepting real orders):
insert into public.products(id,name,category,description,price_cents,image_emoji,badge,delivery_mode,stock,active) values
('11111111-1111-4111-8111-111111111111','Indie Adventure — Digital Edition','game','原创游戏数字商品示例；请替换为真实授权产品',4900,'🎮','FEATURED','manual',50,false),
('22222222-2222-4222-8222-222222222222','Pixel Racer — PC Game','game','赛车游戏示例；请替换为真实授权产品',3900,'🏎️','POPULAR','manual',50,false),
('33333333-3333-4333-8333-333333333333','UWS Productivity Toolkit','software','生产力软件示例；请替换为真实授权产品',7900,'💻','NEW','manual',50,false),
('44444444-4444-4444-8444-444444444444','UWS Creative Utility','software','创作工具示例；请替换为真实授权产品',5900,'🎨','TOP PICK','manual',50,false)
on conflict(id) do nothing;
-- After registering an admin user in Supabase Authentication (with MFA recommended),
-- run the following with their actual UUID (NOT their email):
-- insert into public.admin_users(user_id) values ('YOUR-ADMIN-AUTH-USER-UUID');
