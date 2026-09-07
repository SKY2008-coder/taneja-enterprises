import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureAdminAccess, type ProductImage, type ProductRecord } from "@/lib/supabase/products";

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryHistoryRecord = {
  id: string;
  product_id: string;
  previous_quantity: number;
  new_quantity: number;
  quantity_change: number;
  reason: string;
  created_at: string;
  admin_user_id: string;
};

export function getLowStockThreshold() {
  const configured = Number(process.env.INVENTORY_LOW_STOCK_THRESHOLD);
  return Number.isInteger(configured) && configured >= 1 ? configured : DEFAULT_LOW_STOCK_THRESHOLD;
}

export function getInventoryStatus(quantity: number, threshold = getLowStockThreshold()): InventoryStatus {
  if (quantity <= 0) {
    return "out_of_stock";
  }

  return quantity <= threshold ? "low_stock" : "in_stock";
}

export function getInventoryStatusLabel(status: InventoryStatus) {
  if (status === "out_of_stock") {
    return "Out of Stock";
  }
  if (status === "low_stock") {
    return "Low Stock";
  }
  return "In Stock";
}

export async function getInventoryDashboard(params?: {
  query?: string;
  category?: string;
  status?: InventoryStatus | "";
  sort?: "stock" | "name" | "updated";
}) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const threshold = getLowStockThreshold();
  const search = params?.query?.trim() ?? "";

  let productsQuery = supabase
    .from("products")
    .select("id, name, sku, category, stock_quantity, minimum_order_quantity, updated_at, product_images(image_url, position)");

  if (search) {
    productsQuery = productsQuery.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (params?.category) {
    productsQuery = productsQuery.eq("category", params.category);
  }
  if (params?.status === "in_stock") {
    productsQuery = productsQuery.gt("stock_quantity", threshold);
  }
  if (params?.status === "low_stock") {
    productsQuery = productsQuery.gte("stock_quantity", 1).lte("stock_quantity", threshold);
  }
  if (params?.status === "out_of_stock") {
    productsQuery = productsQuery.eq("stock_quantity", 0);
  }

  if (params?.sort === "name") {
    productsQuery = productsQuery.order("name", { ascending: true });
  } else if (params?.sort === "stock") {
    productsQuery = productsQuery.order("stock_quantity", { ascending: true });
  } else {
    productsQuery = productsQuery.order("updated_at", { ascending: false });
  }

  const [productsResult, totalResult, inStockResult, lowStockResult, outOfStockResult, categoryResult] = await Promise.all([
    productsQuery,
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).gt("stock_quantity", threshold),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .gte("stock_quantity", 1)
      .lte("stock_quantity", threshold),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("stock_quantity", 0),
    supabase.from("products").select("category").not("category", "is", null).order("category", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  const categoryOptions = Array.from(
    new Set((categoryResult.data ?? []).map((row) => row.category).filter(Boolean))
  ) as string[];

  return {
    products: (productsResult.data ?? []).map((product) => ({
      ...product,
      product_images: (product.product_images ?? []).sort(
        (first: ProductImage, second: ProductImage) => (first.position ?? 0) - (second.position ?? 0)
      ),
    })) as ProductRecord[],
    categoryOptions,
    threshold,
    stats: {
      total: totalResult.count ?? 0,
      inStock: inStockResult.count ?? 0,
      lowStock: lowStockResult.count ?? 0,
      outOfStock: outOfStockResult.count ?? 0,
    },
  };
}

export async function getInventoryProduct(productId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, category, stock_quantity, minimum_order_quantity, updated_at, product_images(image_url, position)")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProductRecord | null;
}

export async function getInventoryHistory(productId: string) {
  await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_history")
    .select("id, product_id, previous_quantity, new_quantity, quantity_change, reason, created_at, admin_user_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InventoryHistoryRecord[];
}

export async function adjustInventoryStock(input: {
  productId: string;
  operation: "increase" | "decrease" | "set";
  quantity: number;
  reason: string;
}) {
  const admin = await ensureAdminAccess();
  const supabase = await createServerSupabaseClient();

  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw new Error("Quantity must be a whole number that is zero or greater.");
  }
  if (!input.reason.trim()) {
    throw new Error("A reason is required for every stock change.");
  }
  if (input.operation !== "set" && input.quantity < 1) {
    throw new Error("Increase and decrease quantities must be at least 1.");
  }

  const { data, error } = await supabase.rpc("adjust_inventory_stock", {
    p_product_id: input.productId,
    p_operation: input.operation,
    p_quantity: input.quantity,
    p_reason: input.reason.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { adminId: admin.id, change: (data?.[0] ?? data) as InventoryHistoryRecord };
}
