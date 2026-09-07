-- Taneja Enterprises: atomic customer checkout and order creation.

create sequence if not exists public.order_number_seq;
create sequence if not exists public.invoice_number_seq;

create table if not exists public.checkout_idempotency (
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  order_id uuid references public.orders(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, idempotency_key),
  constraint checkout_idempotency_key_length check (length(idempotency_key) between 16 and 128)
);

create table if not exists public.storefront_settings (
  id boolean primary key default true check (id),
  delivery_charge numeric(12,2) not null default 0 check (delivery_charge >= 0),
  free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.storefront_settings(id) values (true) on conflict (id) do nothing;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  minimum_order numeric(12,2) not null default 0 check (minimum_order >= 0),
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.checkout_idempotency enable row level security;
alter table public.storefront_settings enable row level security;
alter table public.coupons enable row level security;

create index if not exists coupons_code_lower_idx on public.coupons(lower(code));

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_customer_select') then
    create policy orders_customer_select on public.orders for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_customer_select') then
    create policy order_items_customer_select on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_status_history' and policyname = 'order_status_history_customer_select') then
    create policy order_status_history_customer_select on public.order_status_history for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
end
$$;

create or replace function public.create_customer_order(
  p_idempotency_key text,
  p_address_id uuid default null,
  p_new_address jsonb default null,
  p_payment_method text default 'cod',
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_cart_coupon text;
  v_profile record;
  v_address record;
  v_settings record;
  v_coupon record;
  v_existing_order record;
  v_item record;
  v_order public.orders;
  v_idempotency checkout_idempotency%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_image text;
  v_gross numeric(12,2) := 0;
  v_subtotal numeric(12,2) := 0;
  v_product_discount numeric(12,2) := 0;
  v_tax numeric(12,2) := 0;
  v_coupon_discount numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_now timestamptz := timezone('utc', now());
  v_order_number text;
  v_invoice_number text;
  v_new_address jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) not between 16 and 128 then
    raise exception 'Invalid checkout request';
  end if;
  if p_payment_method not in ('cod', 'online') then raise exception 'Invalid payment method'; end if;

  insert into public.checkout_idempotency(user_id, idempotency_key)
    values (v_user_id, trim(p_idempotency_key))
    on conflict (user_id, idempotency_key) do nothing;
  select * into v_idempotency from public.checkout_idempotency
    where user_id = v_user_id and idempotency_key = trim(p_idempotency_key) for update;
  if v_idempotency.order_id is not null then
    select id, order_number into v_existing_order from public.orders where id = v_idempotency.order_id;
    if found then return jsonb_build_object('id', v_existing_order.id, 'order_number', v_existing_order.order_number); end if;
  end if;

  select id, coupon_code into v_cart_id, v_cart_coupon from public.carts where user_id = v_user_id for update;
  if v_cart_id is null then raise exception 'Your cart is empty'; end if;
  p_coupon_code := coalesce(nullif(trim(p_coupon_code), ''), v_cart_coupon);
  select p.full_name, p.phone, u.email into v_profile from public.profiles p join auth.users u on u.id = p.id where p.id = v_user_id;

  if p_address_id is not null then
    select * into v_address from public.addresses where id = p_address_id and user_id = v_user_id for update;
    if not found then raise exception 'Selected address is unavailable'; end if;
  elsif p_new_address is not null then
    if length(trim(coalesce(p_new_address->>'full_name', ''))) not between 2 and 120
      or length(trim(coalesce(p_new_address->>'phone', ''))) not between 10 and 15
      or length(trim(coalesce(p_new_address->>'address_line1', ''))) not between 3 and 240
      or length(trim(coalesce(p_new_address->>'city', ''))) not between 2 and 80
      or length(trim(coalesce(p_new_address->>'state', ''))) not between 2 and 80
      or (p_new_address->>'pincode') !~ '^[0-9]{6}$' then raise exception 'Enter a valid delivery address'; end if;
    update public.addresses set is_default = false where user_id = v_user_id and is_default;
    insert into public.addresses(user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
      values (v_user_id, trim(p_new_address->>'full_name'), trim(p_new_address->>'phone'), trim(p_new_address->>'address_line1'), nullif(trim(p_new_address->>'address_line2'), ''), trim(p_new_address->>'city'), trim(p_new_address->>'state'), trim(p_new_address->>'pincode'), false)
      returning * into v_address;
  else
    select * into v_address from public.addresses where user_id = v_user_id order by is_default desc, created_at desc limit 1 for update;
    if not found then raise exception 'Add a delivery address before placing your order'; end if;
  end if;
  if length(trim(coalesce(v_address.full_name, ''))) < 2 or length(trim(coalesce(v_address.phone, ''))) < 10
    or length(trim(coalesce(v_address.address_line1, ''))) < 3 or v_address.pincode !~ '^[0-9]{6}$' then raise exception 'The delivery address is incomplete or invalid'; end if;

  select * into v_settings from public.storefront_settings where id = true for update;
  for v_item in
    select ci.id, ci.product_id, ci.quantity, p.name, p.sku, p.mrp, p.selling_price, p.gst_percentage, p.stock_quantity, p.minimum_order_quantity, p.is_published
    from public.cart_items ci join public.products p on p.id = ci.product_id where ci.cart_id = v_cart_id order by ci.created_at for update of ci, p
  loop
    if not v_item.is_published then raise exception 'A product in your cart is no longer available'; end if;
    if v_item.stock_quantity is null or v_item.stock_quantity < v_item.quantity then raise exception 'Insufficient stock for %', v_item.name; end if;
    if v_item.quantity < greatest(1, coalesce(v_item.minimum_order_quantity, 1)) then raise exception 'Quantity for % is below the minimum order quantity', v_item.name; end if;
    if v_item.selling_price is null or v_item.selling_price < 0 then raise exception 'Invalid price for %', v_item.name; end if;
    select pi.image_url into v_image from public.product_images pi where pi.product_id = v_item.product_id order by pi.is_primary desc nulls last, pi.position, pi.id limit 1;
    v_gross := v_gross + round(coalesce(v_item.mrp, v_item.selling_price) * v_item.quantity, 2);
    v_subtotal := v_subtotal + round(v_item.selling_price * v_item.quantity, 2);
    v_product_discount := v_product_discount + greatest(0, round((coalesce(v_item.mrp, v_item.selling_price) - v_item.selling_price) * v_item.quantity, 2));
    v_tax := v_tax + round(v_item.selling_price * v_item.quantity * greatest(0, coalesce(v_item.gst_percentage, 0)) / 100, 2);
    v_items := v_items || jsonb_build_array(jsonb_build_object('product_id', v_item.product_id, 'product_name', v_item.name, 'sku', v_item.sku, 'product_image', v_image, 'quantity', v_item.quantity, 'unit_price', v_item.selling_price, 'discount', greatest(0, round((coalesce(v_item.mrp, v_item.selling_price) - v_item.selling_price) * v_item.quantity, 2)), 'gst_amount', round(v_item.selling_price * v_item.quantity * greatest(0, coalesce(v_item.gst_percentage, 0)) / 100, 2), 'line_total', round(v_item.selling_price * v_item.quantity + v_item.selling_price * v_item.quantity * greatest(0, coalesce(v_item.gst_percentage, 0)) / 100, 2)));
  end loop;
  if jsonb_array_length(v_items) = 0 then raise exception 'Your cart is empty'; end if;

  if nullif(trim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon from public.coupons where upper(code) = upper(trim(p_coupon_code)) for update;
    if not found or not v_coupon.is_active or (v_coupon.starts_at is not null and v_coupon.starts_at > v_now) or (v_coupon.ends_at is not null and v_coupon.ends_at < v_now) or v_coupon.minimum_order > v_subtotal or (v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit) then raise exception 'This coupon is invalid or unavailable'; end if;
    v_coupon_discount := case when v_coupon.discount_type = 'percentage' then least(v_subtotal, round(v_subtotal * v_coupon.discount_value / 100, 2)) else least(v_subtotal, v_coupon.discount_value) end;
    update public.coupons set usage_count = usage_count + 1, updated_at = v_now where id = v_coupon.id;
  end if;
  v_delivery := coalesce(v_settings.delivery_charge, 0);
  if v_settings.free_delivery_threshold is not null and v_subtotal - v_coupon_discount >= v_settings.free_delivery_threshold then v_delivery := 0; end if;
  v_total := greatest(0, v_subtotal - v_coupon_discount + v_delivery + v_tax);
  v_order_number := 'TE-' || to_char(v_now, 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  v_invoice_number := 'INV-' || to_char(v_now, 'YYYYMMDD') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
  v_new_address := jsonb_build_object('full_name', v_address.full_name, 'phone', v_address.phone, 'address_line1', v_address.address_line1, 'address_line2', v_address.address_line2, 'city', v_address.city, 'state', v_address.state, 'pincode', v_address.pincode);

  insert into public.orders(user_id, order_number, customer_name, customer_mobile, customer_email, order_status, payment_status, payment_method, subtotal, discount, coupon_discount, delivery_charge, tax, total, shipping_address, invoice_number, inventory_deducted, created_at, updated_at)
    values (v_user_id, v_order_number, coalesce(v_address.full_name, v_profile.full_name), v_address.phone, v_profile.email, 'new', case when p_payment_method = 'cod' then 'cod_pending' else 'pending' end, p_payment_method, v_gross, v_product_discount, v_coupon_discount, v_delivery, v_tax, v_total, v_new_address, v_invoice_number, false, v_now, v_now)
    returning * into v_order;
  for v_item in select * from jsonb_array_elements(v_items) loop
    insert into public.order_items(order_id, product_id, product_name, sku, product_image, quantity, unit_price, discount, gst_amount, line_total)
      values (v_order.id, (v_item.value->>'product_id')::uuid, v_item.value->>'product_name', v_item.value->>'sku', nullif(v_item.value->>'product_image', ''), (v_item.value->>'quantity')::integer, (v_item.value->>'unit_price')::numeric, (v_item.value->>'discount')::numeric, (v_item.value->>'gst_amount')::numeric, (v_item.value->>'line_total')::numeric);
    update public.products set stock_quantity = stock_quantity - (v_item.value->>'quantity')::integer, updated_at = v_now where id = (v_item.value->>'product_id')::uuid and stock_quantity >= (v_item.value->>'quantity')::integer;
    if not found then raise exception 'Insufficient stock'; end if;
  end loop;
  update public.orders set inventory_deducted = true, updated_at = v_now where id = v_order.id;
  insert into public.order_status_history(order_id, previous_status, new_status, changed_by, note) values (v_order.id, null, 'new', v_user_id, 'Order placed by customer');
  delete from public.cart_items where cart_id = v_cart_id;
  update public.carts set coupon_code = null, updated_at = v_now where id = v_cart_id;
  update public.checkout_idempotency set order_id = v_order.id where user_id = v_user_id and idempotency_key = trim(p_idempotency_key);
  return jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'total', v_order.total, 'payment_status', v_order.payment_status);
end;
$$;

revoke all on function public.create_customer_order(text, uuid, jsonb, text, text) from public, anon;
grant execute on function public.create_customer_order(text, uuid, jsonb, text, text) to authenticated;