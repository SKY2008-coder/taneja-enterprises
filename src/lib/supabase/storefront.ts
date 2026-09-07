import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type ProductImage, type ProductRecord } from "@/lib/supabase/products";

export async function getPublishedProducts(params?: { query?: string; category?: string; brand?: string; subcategory?: string; minPrice?: number; maxPrice?: number; availability?: string; featured?: boolean; newArrival?: boolean; sort?: string; page?: number; pageSize?: number }) {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, Number(params?.page ?? 1));
  const pageSize = Math.min(48, Math.max(1, Number(params?.pageSize ?? 24)));
  let query = supabase.from("products").select("*, product_images(image_url, position, id, is_primary)", { count: "exact" }).eq("is_published", true);
  const search = params?.query?.trim();
  if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%,description.ilike.%${search}%`);
  if (params?.category) query = query.eq("category", params.category);
  if (params?.brand) query = query.eq("brand", params.brand);
  if (params?.subcategory) query = query.eq("subcategory", params.subcategory);
  if (Number.isFinite(params?.minPrice)) query = query.gte("selling_price", params?.minPrice as number);
  if (Number.isFinite(params?.maxPrice)) query = query.lte("selling_price", params?.maxPrice as number);
  if (params?.availability === "in_stock") query = query.gt("stock_quantity", 0);
  if (params?.availability === "out_of_stock") query = query.eq("stock_quantity", 0);
  if (params?.featured) query = query.eq("is_featured", true);
  if (params?.newArrival) query = query.eq("is_new_arrival", true);
  if (params?.sort === "price_asc") query = query.order("selling_price", { ascending: true });
  else if (params?.sort === "price_desc") query = query.order("selling_price", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);
  return { products: (data ?? []) as ProductRecord[], count: count ?? 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) };
}

export async function getPublishedProductBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("*, product_images(image_url, position, id, is_primary)").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data as ProductRecord | null;
}

export async function getPublishedProductById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("products").select("*, product_images(image_url, position, id, is_primary)").eq("id", id).eq("is_published", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data as ProductRecord | null;
}

export async function getHomepageSections() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("homepage_sections").select("*").order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).filter((section) => section.is_visible !== false);
}

export async function getProductReviews(productId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getActiveCategories() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("categories").select("id, name, slug, description, parent_id, sort_order").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveCategory(slug: string) {
  const categories = await getActiveCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getPublicWishlist() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("wishlist").select("id, product_id, product:products(*)").eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return (data ?? []).map((entry) => ({
    ...entry,
    product: Array.isArray(entry.product) ? entry.product[0] ?? null : entry.product,
  }));
}

export async function getCart() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], subtotal: 0, discount: 0, total: 0 };
  const { data: cart } = await supabase.from("carts").select("id, coupon_code").eq("user_id", user.id).maybeSingle();
  if (!cart) return { items: [], subtotal: 0, discount: 0, total: 0 };
  const { data, error } = await supabase.from("cart_items").select("id, quantity, product:products(id,name,slug,brand,mrp,selling_price,discount,gst_percentage,stock_quantity,minimum_order_quantity,is_published,product_images(image_url,position))").eq("cart_id", cart.id);
  if (error) throw new Error(error.message);
  const items = (data ?? []).map((item) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] ?? null : item.product,
  }));
  const subtotal = items.reduce((sum, item) => sum + Number(item.product?.selling_price ?? 0) * Number(item.quantity), 0);
  return { items, subtotal, discount: 0, total: subtotal, couponCode: cart.coupon_code };
}

export async function getCustomerOrders() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("orders").select("id, order_number, order_status, payment_status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCustomerOrder(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("orders").select("*, order_items(*, product:products(name,slug,sku,product_images(image_url,position))), order_status_history(*)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return { user, profile: data };
}

export async function getAddresses() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCheckoutSettings() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("storefront_settings").select("delivery_charge").eq("id", true).maybeSingle();
  return { deliveryCharge: Number(data?.delivery_charge ?? 0) };
}

export type PublicProductImage = ProductImage;
