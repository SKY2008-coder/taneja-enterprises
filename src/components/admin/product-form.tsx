"use client";

import { useMemo, useState } from "react";
import type { ProductImage, ProductRecord } from "@/lib/supabase/products";

type CategoryOption = {
  id: string;
  name: string;
  slug?: string | null;
};

type ProductFormProps = {
  mode: "create" | "edit";
  product?: ProductRecord | null;
  categories: CategoryOption[];
};

function createPreviewKey() {
  return `new-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`;
}

export function ProductForm({ mode, product, categories }: ProductFormProps) {
  const initialImages = useMemo(() => product?.product_images ?? [], [product]);
  const [category, setCategory] = useState(product?.category ?? categories[0]?.name ?? "");
  const [removeImageIds, setRemoveImageIds] = useState<string[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState(
    initialImages.find((image) => image.is_primary)?.id ?? initialImages[0]?.id ?? ""
  );
  const [imageOrder, setImageOrder] = useState<string[]>(
    initialImages.map((image) => image.id ?? image.image_url).filter(Boolean)
  );
  const [newPreviews, setNewPreviews] = useState<Array<{ id: string; url: string; file: File }>>([]);

  const allImages = useMemo(() => {
    const existing = initialImages
      .filter((image) => !removeImageIds.includes(image.id ?? ""))
      .map((image) => ({
        id: image.id ?? image.image_url,
        url: image.image_url,
        kind: "existing" as const,
      }));

    const newImages = newPreviews.map((preview) => ({
      id: preview.id,
      url: preview.url,
      kind: "new" as const,
    }));

    const ordered = [...existing, ...newImages].sort((left, right) => {
      const leftIndex = imageOrder.indexOf(left.id);
      const rightIndex = imageOrder.indexOf(right.id);
      if (leftIndex === -1 && rightIndex === -1) return 0;
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

    return ordered;
  }, [imageOrder, initialImages, newPreviews, removeImageIds]);

  const visibleImageIds = allImages.map((image) => image.id);
  const selectedPrimaryId = primaryImageId || visibleImageIds[0] || "";

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const previews = files.map((file) => ({
      id: createPreviewKey(),
      url: URL.createObjectURL(file),
      file,
    }));

    setNewPreviews((current) => [...current, ...previews]);
    setImageOrder((current) => [...current, ...previews.map((preview) => preview.id)]);
    event.target.value = "";
  }

  function removeExistingImage(imageId: string) {
    setRemoveImageIds((current) => [...current, imageId]);
    setImageOrder((current) => current.filter((id) => id !== imageId));
    if (primaryImageId === imageId) {
      setPrimaryImageId("");
    }
  }

  function removeNewPreview(previewId: string) {
    setNewPreviews((current) => current.filter((preview) => preview.id !== previewId));
    setImageOrder((current) => current.filter((id) => id !== previewId));
    if (primaryImageId === previewId) {
      setPrimaryImageId("");
    }
  }

  function moveImage(direction: "left" | "right", index: number) {
    const next = [...allImages];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setImageOrder(next.map((image) => image.id));
  }

  function setPrimary(imageId: string) {
    setPrimaryImageId(imageId);
  }

  const effectiveCategory = category || categories[0]?.name || "Uncategorized";

  return (
    <form action={mode === "create" ? undefined : undefined} className="grid gap-5 md:grid-cols-2" encType="multipart/form-data">
      {mode === "edit" && product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="remove_image_ids" value={removeImageIds.join(",")} />
      <input type="hidden" name="existing_image_ids" value={visibleImageIds.filter((id) => !id.startsWith("new-")) .join(",")} />
      <input type="hidden" name="primary_image_id" value={selectedPrimaryId} />

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="name" className="text-sm font-semibold text-slate-700">
          Product name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-semibold text-slate-700">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={product?.slug ?? ""}
          placeholder="example-product"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="brand" className="text-sm font-semibold text-slate-700">
          Brand
        </label>
        <input
          id="brand"
          name="brand"
          defaultValue={product?.brand ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-semibold text-slate-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={effectiveCategory}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        >
          {categories.length === 0 ? <option value="">No categories available</option> : null}
          {categories.map((categoryOption) => (
            <option key={categoryOption.id} value={categoryOption.name}>
              {categoryOption.name}
            </option>
          ))}
          {!categories.some((option) => option.name === effectiveCategory) ? (
            <option value={effectiveCategory}>{effectiveCategory}</option>
          ) : null}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-semibold text-slate-700">
          Subcategory
        </label>
        <input
          id="subcategory"
          name="subcategory"
          defaultValue={product?.subcategory ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sku" className="text-sm font-semibold text-slate-700">
          SKU
        </label>
        <input
          id="sku"
          name="sku"
          required
          defaultValue={product?.sku ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="stock_quantity" className="text-sm font-semibold text-slate-700">
          Stock quantity
        </label>
        <input
          id="stock_quantity"
          type="number"
          min="0"
          name="stock_quantity"
          defaultValue={product?.stock_quantity ?? 0}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="mrp" className="text-sm font-semibold text-slate-700">
          MRP
        </label>
        <input
          id="mrp"
          type="number"
          step="0.01"
          min="0"
          name="mrp"
          required
          defaultValue={product?.mrp ?? 0}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="selling_price" className="text-sm font-semibold text-slate-700">
          Selling price
        </label>
        <input
          id="selling_price"
          type="number"
          step="0.01"
          min="0"
          name="selling_price"
          required
          defaultValue={product?.selling_price ?? 0}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="wholesale_price" className="text-sm font-semibold text-slate-700">
          Wholesale price
        </label>
        <input
          id="wholesale_price"
          type="number"
          step="0.01"
          min="0"
          name="wholesale_price"
          defaultValue={product?.wholesale_price ?? 0}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="discount" className="text-sm font-semibold text-slate-700">
          Discount %
        </label>
        <input
          id="discount"
          type="number"
          step="0.01"
          min="0"
          name="discount"
          defaultValue={product?.discount ?? 0}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="gst_percentage" className="text-sm font-semibold text-slate-700">
          GST %
        </label>
        <input
          id="gst_percentage"
          type="number"
          step="0.01"
          min="0"
          name="gst_percentage"
          defaultValue={product?.gst_percentage ?? 0}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="minimum_order_quantity" className="text-sm font-semibold text-slate-700">
          Minimum order qty
        </label>
        <input
          id="minimum_order_quantity"
          type="number"
          min="1"
          name="minimum_order_quantity"
          defaultValue={product?.minimum_order_quantity ?? 1}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-semibold text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="specifications" className="text-sm font-semibold text-slate-700">
          Specifications
        </label>
        <textarea
          id="specifications"
          name="specifications"
          rows={5}
          defaultValue={
            product && product.specifications
              ? Object.entries(product.specifications)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("\n")
              : ""
          }
          placeholder="Color: Blue\nMaterial: Cotton\nWeight: 400g"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="images" className="text-sm font-semibold text-slate-700">
          Product images
        </label>
        <input
          id="images"
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm"
        />

        {allImages.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {allImages.map((image, index) => (
              <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="relative">
                  <img src={image.url} alt="Product preview" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPrimary(image.id)}
                    className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold ${
                      selectedPrimaryId === image.id ? "bg-slate-900 text-white" : "bg-white/90 text-slate-700"
                    }`}
                  >
                    {selectedPrimaryId === image.id ? "Primary" : "Set primary"}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveImage("left", index)}
                      disabled={index === 0}
                      className="rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage("right", index)}
                      disabled={index === allImages.length - 1}
                      className="rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      image.id.startsWith("new-") ? removeNewPreview(image.id) : removeExistingImage(image.id)
                    }
                    className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="h-4 w-4" />
        <label className="text-sm font-medium text-slate-700">Featured</label>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" name="is_bestseller" defaultChecked={product?.is_bestseller ?? false} className="h-4 w-4" />
        <label className="text-sm font-medium text-slate-700">Bestseller</label>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" name="is_new_arrival" defaultChecked={product?.is_new_arrival ?? false} className="h-4 w-4" />
        <label className="text-sm font-medium text-slate-700">New arrival</label>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" name="is_published" defaultChecked={product?.is_published ?? true} className="h-4 w-4" />
        <label className="text-sm font-medium text-slate-700">Published</label>
      </div>

      <div className="md:col-span-2 flex justify-end pt-2">
        <button
          type="submit"
          className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white"
        >
          {mode === "create" ? "Save product" : "Update product"}
        </button>
      </div>
    </form>
  );
}
