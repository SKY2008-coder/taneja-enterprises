-- Taneja Enterprises: additive order-management support.
-- This migration does not create orders or demo data.

alter table public.orders
  add column if not exists subtotal numeric(12,2),
  add column if not exists coupon_discount numeric(12,2) not null default 0,
  add column if not exists delivery_charge numeric(12,2) not null default 0,
  add column if not exists tax numeric(12,2) not null default 0,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists invoice_number text,
  add column if not exists inventory_deducted boolean not null default false,
  add column if not exists inventory_restored_at timestamptz;

alter table public.order_items
  add column if not exists gst_amount numeric(12,2) not null default 0,
  add column if not exists line_total numeric(12,2),
  add column if not exists product_image text;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint order_status_history_new_status_check check (
    new_status in ('new', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded')
  )
);

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  note text not null check (length(trim(note)) > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_status_history_order_created_idx
  on public.order_status_history(order_id, created_at desc);
create index if not exists order_notes_order_created_idx
  on public.order_notes(order_id, created_at desc);
create unique index if not exists orders_invoice_number_unique
  on public.orders(invoice_number)
  where invoice_number is not null;

alter table public.order_status_history enable row level security;
alter table public.order_notes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_admin_select') then
    create policy orders_admin_select on public.orders for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_admin_select') then
    create policy order_items_admin_select on public.order_items for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_status_history' and policyname = 'order_status_history_admin_select') then
    create policy order_status_history_admin_select on public.order_status_history for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_notes' and policyname = 'order_notes_admin_select') then
    create policy order_notes_admin_select on public.order_notes for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_notes' and policyname = 'order_notes_admin_insert') then
    create policy order_notes_admin_insert on public.order_notes for insert to authenticated with check (public.is_admin() and created_by = auth.uid());
  end if;
end
$$;

create or replace function public.change_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_previous_status text;
  v_allowed boolean := false;
  v_terminal boolean := false;
  v_should_restore boolean := false;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_new_status not in ('new', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded') then
    raise exception 'Invalid order status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if v_order.order_status = p_new_status then
    return v_order;
  end if;

  v_allowed := case v_order.order_status
    when 'new' then p_new_status in ('confirmed', 'cancelled')
    when 'confirmed' then p_new_status in ('processing', 'cancelled')
    when 'processing' then p_new_status in ('packed', 'cancelled')
    when 'packed' then p_new_status in ('shipped', 'cancelled')
    when 'shipped' then p_new_status in ('delivered', 'returned')
    when 'delivered' then p_new_status in ('returned')
    when 'cancelled' then p_new_status in ('refunded')
    when 'returned' then p_new_status in ('refunded')
    when 'refunded' then false
    else false
  end;

  if not v_allowed then
    raise exception 'Invalid order status transition from % to %', v_order.order_status, p_new_status;
  end if;

  v_previous_status := v_order.order_status;
  v_terminal := p_new_status in ('cancelled', 'returned');
  v_should_restore := v_terminal and v_order.inventory_deducted and v_order.inventory_restored_at is null;

  update public.orders
  set order_status = p_new_status,
      updated_at = timezone('utc', now()),
      inventory_restored_at = case
        when v_should_restore then timezone('utc', now())
        else inventory_restored_at
      end
  where id = p_order_id
  returning * into v_order;

  if v_should_restore then
    update public.products p
    set stock_quantity = p.stock_quantity + item.quantity,
        updated_at = timezone('utc', now())
    from public.order_items item
    where item.order_id = p_order_id
      and item.product_id = p.id
        and p.stock_quantity is not null;
  end if;

  insert into public.order_status_history(order_id, previous_status, new_status, changed_by, note)
      values (p_order_id, v_previous_status, p_new_status, auth.uid(), nullif(trim(p_note), ''));

  return v_order;
end;
$$;

revoke all on function public.change_order_status(uuid, text, text) from public, anon;
grant execute on function public.change_order_status(uuid, text, text) to authenticated;

create or replace function public.reserve_order_inventory(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_order_user_id uuid;
  v_inventory_deducted boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select user_id, inventory_deducted
  into v_order_user_id, v_inventory_deducted
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order_user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Order access denied';
  end if;
  if v_inventory_deducted then return; end if;
  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id for update loop
    update public.products
    set stock_quantity = stock_quantity - v_item.quantity,
        updated_at = timezone('utc', now())
    where id = v_item.product_id and stock_quantity >= v_item.quantity;
    if not found then raise exception 'Insufficient stock'; end if;
  end loop;
  update public.orders set inventory_deducted = true, updated_at = timezone('utc', now()) where id = p_order_id;
end;
$$;

revoke all on function public.reserve_order_inventory(uuid) from public, anon;
grant execute on function public.reserve_order_inventory(uuid) to authenticated;
