-- Taneja Enterprises: customer storefront persistence.
-- Additive only. No product, customer, order, or demo data is created.

alter table public.wishlist enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wishlist' and policyname = 'wishlist_owner_select') then
    create policy wishlist_owner_select on public.wishlist for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wishlist' and policyname = 'wishlist_owner_insert') then
    create policy wishlist_owner_insert on public.wishlist for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wishlist' and policyname = 'wishlist_owner_delete') then
    create policy wishlist_owner_delete on public.wishlist for delete to authenticated using (user_id = auth.uid());
  end if;
end
$$;

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  coupon_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(cart_id, product_id)
);

create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists cart_items_product_idx on public.cart_items(product_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'carts' and policyname = 'carts_owner_select') then
    create policy carts_owner_select on public.carts for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'carts' and policyname = 'carts_owner_insert') then
    create policy carts_owner_insert on public.carts for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'carts' and policyname = 'carts_owner_update') then
    create policy carts_owner_update on public.carts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'carts' and policyname = 'carts_owner_delete') then
    create policy carts_owner_delete on public.carts for delete to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cart_items' and policyname = 'cart_items_owner_select') then
    create policy cart_items_owner_select on public.cart_items for select to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cart_items' and policyname = 'cart_items_owner_insert') then
    create policy cart_items_owner_insert on public.cart_items for insert to authenticated with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cart_items' and policyname = 'cart_items_owner_update') then
    create policy cart_items_owner_update on public.cart_items for update to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cart_items' and policyname = 'cart_items_owner_delete') then
    create policy cart_items_owner_delete on public.cart_items for delete to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
  end if;
end
$$;

create or replace function public.add_cart_item(p_product_id uuid, p_quantity integer)
returns public.cart_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_stock integer;
  v_moq integer;
  v_published boolean;
  v_item public.cart_items;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if p_quantity is null or p_quantity < 1 then raise exception 'Quantity must be at least 1'; end if;
  select stock_quantity, minimum_order_quantity, is_published into v_stock, v_moq, v_published from public.products where id = p_product_id;
  if not found or not v_published then raise exception 'Product is unavailable'; end if;
  if v_stock <= 0 or p_quantity > v_stock then raise exception 'Requested quantity is unavailable'; end if;
  if p_quantity < coalesce(v_moq, 1) then raise exception 'Quantity is below the minimum order quantity'; end if;
  insert into public.carts(user_id) values (auth.uid()) on conflict (user_id) do update set updated_at = timezone('utc', now()) returning id into v_cart_id;
  insert into public.cart_items(cart_id, product_id, quantity) values (v_cart_id, p_product_id, p_quantity)
  on conflict (cart_id, product_id) do update set quantity = public.cart_items.quantity + excluded.quantity, updated_at = timezone('utc', now())
  returning * into v_item;
  if v_item.quantity > v_stock then raise exception 'Requested quantity is unavailable'; end if;
  return v_item;
end;
$$;

revoke all on function public.add_cart_item(uuid, integer) from public, anon;
grant execute on function public.add_cart_item(uuid, integer) to authenticated;
