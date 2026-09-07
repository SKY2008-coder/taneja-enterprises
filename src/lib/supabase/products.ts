import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfileRole } from "@/lib/supabase/server";

export const PRODUCT_BUCKET = "product-images";

export type ProductImage = {
  id?: string;
  product_id?: string;
  image_url: string;
  position?: number;
  alt_text?: string | null;
  is_primary?: boolean | null;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug?: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  sku: string;
  mrp: number;
  selling_price: number;
  wholesale_price: number;
  discount: number;
  gst_percentage: number;
  stock_quantity: number;
  minimum_order_quantity: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  product_images?: ProductImage[];
};

export async function ensureAdminAccess() {
  const { user, isAdmin } = await getCurrentProfileRole();

  if (!user || !isAdmin) {
    redirect("/admin/login");
  }

  return user;
}

export async function getCategoriesForAdmin() {
  const supabase = await createServerSupabaseClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .order("name", { ascending: true });

  if (error) {
    const { data: categoryRows } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)
      .order("category", { ascending: true });

    const fallback = Array.from(
      new Set((categoryRows ?? []).map((row) => row.category).filter(Boolean))
    ).map((category) => ({ id: category, name: category, slug: category, parent_id: null }));

    return fallback;
  }

  return (categories ?? []).map((category) => ({
    id: category.id ?? category.slug ?? category.name,
    name: category.name,
    slug: category.slug ?? category.name,
    parent_id: category.parent_id ?? null,
  }));
}

export async function getProductsForAdmin(params?: {
  query?: string;
  category?: string;
  stockStatus?: string;
  published?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, Number(params?.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(params?.pageSize ?? 20)));
  const sort = params?.sort ?? "newest";

  let queryBuilder = supabase
    .from("products")
    .select("*, product_images(image_url, position, id, is_primary)", { count: "exact" });

  const search = params?.query?.trim() ?? "";
  if (search) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`
    );
  }

  const category = params?.category?.trim() ?? "";
  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  const stockStatus = params?.stockStatus ?? "";
  if (stockStatus === "in_stock") {
    queryBuilder = queryBuilder.gt("stock_quantity", 0);
  }
  if (stockStatus === "low_stock") {
    queryBuilder = queryBuilder.lte("stock_quantity", 10).gt("stock_quantity", 0);
  }
  if (stockStatus === "out_of_stock") {
    queryBuilder = queryBuilder.eq("stock_quantity", 0);
  }

  const published = params?.published ?? "";
  if (published === "published") {
    queryBuilder = queryBuilder.eq("is_published", true);
  }
  if (published === "draft") {
    queryBuilder = queryBuilder.eq("is_published", false);
  }

  if (sort === "newest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }
  if (sort === "name") {
    queryBuilder = queryBuilder.order("name", { ascending: true });
  }
  if (sort === "price") {
    queryBuilder = queryBuilder.order("selling_price", { ascending: false });
  }
  if (sort === "stock") {
    queryBuilder = queryBuilder.order("stock_quantity", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data: products, count, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  const normalized = (products ?? []).map((product) => ({
    ...product,
    product_images: (product.product_images ?? []).sort(
      (a: ProductImage, b: ProductImage) => (a.position ?? 0) - (b.position ?? 0)
    ),
  }));

  const categoryOptions = (await getCategoriesForAdmin()).map((categoryRow) => categoryRow.name);

  return {
    products: normalized as ProductRecord[],
    categoryOptions,
    totalCount: count ?? normalized.length,
    page,
    pageSize,
  };
}

export async function getProductById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, product_images(image_url, position, id, is_primary)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!product) {
    return null;
  }

  return {
    ...product,
    product_images: (product.product_images ?? []).sort(
      (a: ProductImage, b: ProductImage) => (a.position ?? 0) - (b.position ?? 0)
    ),
  } as ProductRecord;
}

export function formatSpecifications(specs: Record<string, string> | null | undefined) {
  if (!specs) {
    return "";
  }

  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function parseSpecifications(raw: string | null) {
  if (!raw || !raw.trim()) {
    return {};
  }

  const parsed: Record<string, string> = {};

  raw.split(/\n+/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      parsed[trimmed] = "";
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key) {
      parsed[key] = value;
    }
  });

  return parsed;
}

export function parseProductFormData(formData: FormData) {
  const toNumber = (value: FormDataEntryValue | null, fallback: number) => {
    if (value === null || value === "") {
      return fallback;
    }

    const asNumber = Number(String(value));
    return Number.isFinite(asNumber) ? asNumber : fallback;
  };

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const subcategory = String(formData.get("subcategory") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const specificationsInput = String(formData.get("specifications") ?? "");
  const sku = String(formData.get("sku") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  const payload = {
    name,
    slug: slug || null,
    brand: brand || null,
    category: category || "Uncategorized",
    subcategory: subcategory || null,
    description: description || null,
    specifications: parseSpecifications(specificationsInput),
    sku,
    mrp: toNumber(formData.get("mrp"), 0),
    selling_price: toNumber(formData.get("selling_price"), 0),
    wholesale_price: toNumber(formData.get("wholesale_price"), 0),
    discount: toNumber(formData.get("discount"), 0),
    gst_percentage: toNumber(formData.get("gst_percentage"), 0),
    stock_quantity: Math.max(0, Math.floor(toNumber(formData.get("stock_quantity"), 0))),
    minimum_order_quantity: Math.max(
      1,
      Math.floor(toNumber(formData.get("minimum_order_quantity"), 1))
    ),
    is_featured: String(formData.get("is_featured") ?? "") === "on",
    is_bestseller: String(formData.get("is_bestseller") ?? "") === "on",
    is_new_arrival: String(formData.get("is_new_arrival") ?? "") === "on",
    is_published: String(formData.get("is_published") ?? "") === "on",
  };

  return payload;
}

export function validateProductPayload(payload: ReturnType<typeof parseProductFormData>) {
  if (!payload.name) {
    throw new Error("Product name is required.");
  }

  if (!payload.sku) {
    throw new Error("SKU is required.");
  }

  if (payload.mrp <= 0) {
    throw new Error("MRP must be greater than zero.");
  }

  if (payload.selling_price <= 0) {
    throw new Error("Selling price must be greater than zero.");
  }

  if (payload.wholesale_price < 0) {
    throw new Error("Wholesale price cannot be negative.");
  }

  if (payload.discount < 0) {
    throw new Error("Discount cannot be negative.");
  }

  if (payload.gst_percentage < 0) {
    throw new Error("GST cannot be negative.");
  }

  if (payload.stock_quantity < 0) {
    throw new Error("Stock quantity cannot be negative.");
  }

  if (payload.minimum_order_quantity < 1) {
    throw new Error("Minimum order quantity must be at least 1.");
  }
}

export async function uploadProductImages(productId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const files = Array.from(formData.getAll("images")).filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );

  if (!files.length) {
    return;
  }

  const uploaded: ProductImage[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const storagePath = `${productId}/${Date.now()}-${index}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      throw new Error(
        `Image upload failed for ${file.name}: ${uploadError.message}. Create the ${PRODUCT_BUCKET} bucket in Supabase Storage and allow admin uploads.`
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(storagePath);

    uploaded.push({
      image_url: publicUrl,
      position: index,
      alt_text: "Product image",
    });
  }

  if (uploaded.length) {
    const { error: insertError } = await supabase.from("product_images").insert(
      uploaded.map((image) => ({
        product_id: productId,
        image_url: image.image_url,
        position: image.position,
        alt_text: image.alt_text,
      }))
    );

    if (insertError) {
      throw new Error(`Failed to save product image URLs: ${insertError.message}`);
    }
  }
}

export async function deleteSpecificProductImages(productId: string, imageIds: string[]) {
  if (!imageIds.length) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const cleaned = imageIds.filter(Boolean);
  if (!cleaned.length) {
    return;
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("id, image_url")
    .in("id", cleaned)
    .eq("product_id", productId);

  if (images && images.length) {
    const storagePaths = images
      .map((image) => image.image_url)
      .map((url) => {
        try {
          const parsed = new URL(url);
          const path = parsed.pathname.replace(/^\/+/, "");
          const parts = path.split("/");
          const bucketIndex = parts.findIndex((part) => part === PRODUCT_BUCKET);
          if (bucketIndex === -1 || bucketIndex + 1 >= parts.length) {
            return null;
          }
          return parts.slice(bucketIndex + 1).join("/");
        } catch {
          return null;
        }
      })
      .filter((value): value is string => Boolean(value));

    if (storagePaths.length) {
      await supabase.storage.from(PRODUCT_BUCKET).remove(storagePaths);
    }
  }

  await supabase.from("product_images").delete().in("id", cleaned).eq("product_id", productId);
}

export async function deleteProductImagesByProduct(productId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("id, image_url")
    .eq("product_id", productId);

  if (images && images.length) {
    const storagePaths = images
      .map((image) => image.image_url)
      .map((url) => {
        try {
          const parsed = new URL(url);
          const path = parsed.pathname.replace(/^\/+/, "");
          const parts = path.split("/");
          const productBucketIndex = parts.findIndex((part) => part === PRODUCT_BUCKET);
          if (productBucketIndex === -1 || productBucketIndex + 1 >= parts.length) {
            return null;
          }
          return parts.slice(productBucketIndex + 1).join("/");
        } catch {
          return null;
        }
      })
      .filter((value): value is string => Boolean(value));

    if (storagePaths.length) {
      await supabase.storage.from(PRODUCT_BUCKET).remove(storagePaths);
    }
  }

  await supabase.from("product_images").delete().eq("product_id", productId);
}
