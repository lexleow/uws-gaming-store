-- Phase 2 additive migration: run once in Supabase SQL Editor.
-- This script does not drop existing products or orders.
alter table public.products add column if not exists image_url text not null default '';
alter table public.products add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.order_items add column if not exists option_id uuid;
alter table public.order_items add column if not exists option_label text;
alter table public.products add constraint products_options_array check (jsonb_typeof(options)='array');
-- Public images only. Restrict uploads to authenticated server-side admin API.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
-- No storage INSERT/UPDATE/DELETE policies for anon or authenticated:
-- all writes via checked server-side service role only.
-- Existing public active-product SELECT policy remains unchanged.
