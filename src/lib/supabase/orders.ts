import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureAdminAccess, type ProductImage } from "@/lib/supabase/products";

export const ORDER_STATUSES = ["new", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "returned", "refunded"] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "cod_pending", "cod_collected"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type AdminOrder = {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name?: string | null;
  customer_mobile?: string | null;
  customer_email?: string | null;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string | null;
  payment_reference?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  coupon_discount?: number | null;
  delivery_charge?: number | null;
  tax?: number | null;
  total: number;
  shipping_address?: Record<string, unknown> | string | null;
  invoice_number?: string | null;
  inventory_deducted?: boolean;
  created_at: string;
  updated_at?: string | null;
  order_items?: AdminOrderItem[];
};

export type AdminOrderItem = {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name?: string | null;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number | null;
  gst_amount?: number | null;
  line_total?: number | null;
  product_image?: string | null;
  product?: { name?: string | null; sku?: string | null; product_images?: ProductImage[] } | null;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  previous_status?: string | null;
  new_status: OrderStatus;
  changed_by: string;
  note?: string | null;
  created_at: string;
};

export type OrderNote = {
  id: string;
  order_id: string;
  note: string;
  created_by: string;
  created_at: string;
};

function asStatus(value: unknown): OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : "new";
}

function asPaymentStatus(value: unknown): PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : "pending";
}

export function formatMoney(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function orderStatusLabel(status: OrderStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function paymentStatusLabel(status: PaymentStatus) {
  if (status === "cod_pending") return "COD Pending";
  if (status === "cod_collected") return "COD Collected";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function allowedOrderTransitions(status: OrderStatus) {
  const map: Record<OrderStatus, OrderStatus[]> = {
    new: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["delivered", "returned"],
    delivered: ["returned"],
    cancelled: ["refunded"],
    returned: ["refunded"],
    refunded: [],
  };
  return map[status];
}

function normalizeOrder(order: Record<string, unknown>): AdminOrder {
  return {
    ...order,
    order_status: asStatus(order.order_status),
    payment_status: asPaymentStatus(order.payment_status),
    total: Number(order.total ?? 0),
  } as AdminOrder;
}

export async function getOrdersForAdmin(params?: {
  query?: string;
  orderStatus?: OrderStatus | "";
  paymentStatus?: PaymentStatus | "";
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, Number(params?.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(params?.pageSize ?? 20)));
  let query = supabase.from("orders").select("id, order_number, user_id, customer_name, customer_mobile, customer_email, order_status, payment_status, payment_method, total, created_at, updated_at", { count: "exact" });
  const search = params?.query?.trim() ?? "";

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_mobile.ilike.%${search}%`);
  }
  if (params?.orderStatus) query = query.eq("order_status", params.orderStatus);
  if (params?.paymentStatus) query = query.eq("payment_status", params.paymentStatus);
  if (params?.from) query = query.gte("created_at", `${params.from}T00:00:00.000Z`);
  if (params?.to) query = query.lt("created_at", `${params.to}T23:59:59.999Z`);
  query = query.order("created_at", { ascending: params?.sort === "oldest" });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const orders = (data ?? []).map((row) => normalizeOrder(row as Record<string, unknown>));
  const itemCounts = new Map<string, number>();
  if (orders.length) {
    const { data: itemRows, error: itemError } = await supabase
      .from("order_items")
      .select("order_id, quantity")
      .in("order_id", orders.map((order) => order.id));
    if (itemError) throw new Error(itemError.message);
    for (const item of itemRows ?? []) {
      itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + Number(item.quantity ?? 0));
    }
  }
  const [{ count: totalCount }, { count: newCount }, { count: confirmedCount }, { count: processingCount }, { count: packedCount }, { count: shippedCount }, { count: deliveredCount }, { count: cancelledCount }, { count: returnedCount }, { count: refundedCount }, { count: pendingPaymentCount }, { count: paidCount }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    ...ORDER_STATUSES.map((status) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_status", status)),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
  ]);

  return {
    orders: orders.map((order) => ({ ...order, itemCount: itemCounts.get(order.id) ?? 0 })),
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    stats: { total: totalCount ?? 0, new: newCount ?? 0, confirmed: confirmedCount ?? 0, processing: processingCount ?? 0, packed: packedCount ?? 0, shipped: shippedCount ?? 0, delivered: deliveredCount ?? 0, cancelled: cancelledCount ?? 0, returned: returnedCount ?? 0, refunded: refundedCount ?? 0, pendingPayment: pendingPaymentCount ?? 0, paid: paidCount ?? 0 },
  };
}

export async function getOrderById(id: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeOrder(data as Record<string, unknown>) : null;
}

export async function getOrderItems(orderId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("order_items").select("*, product:products(name, sku, product_images(image_url, position))").eq("order_id", orderId);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminOrderItem[];
}

export async function getOrderHistory(orderId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("order_status_history").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderStatusHistory[];
}

export async function getOrderNotes(orderId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("order_notes").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderNote[];
}

export async function changeOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("change_order_status", { p_order_id: orderId, p_new_status: status, p_note: note?.trim() || null });
  if (error) throw new Error(error.message);
}

export async function addOrderNote(orderId: string, note: string) {
  const admin = await ensureAdminAccess();
  const cleaned = note.trim();
  if (!cleaned) throw new Error("Order note cannot be empty.");
  if (cleaned.length > 2000) throw new Error("Order note is too long.");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("order_notes").insert({ order_id: orderId, note: cleaned, created_by: admin.id });
  if (error) throw new Error(error.message);
}
