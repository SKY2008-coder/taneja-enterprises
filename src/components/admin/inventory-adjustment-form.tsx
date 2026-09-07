"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { adjustInventoryAction } from "@/app/admin/inventory/actions";

type Operation = "increase" | "decrease" | "set";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#172d27] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save stock change"}
    </button>
  );
}

export function InventoryAdjustmentForm({
  productId,
  currentQuantity,
}: {
  productId: string;
  currentQuantity: number;
}) {
  const [operation, setOperation] = useState<Operation>("increase");
  const [quantity, setQuantity] = useState("1");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const numericQuantity = Number(quantity);
    const isLargeChange = operation === "set"
      ? Math.abs(numericQuantity - currentQuantity) >= 25
      : numericQuantity >= 25;

    if (isLargeChange && !window.confirm("This is a large stock change. Confirm that the quantity and reason are correct.")) {
      event.preventDefault();
    }
  }

  return (
    <form action={adjustInventoryAction} onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="product_id" value={productId} />

      <div className="space-y-2">
        <label htmlFor="operation" className="text-sm font-semibold text-slate-700">Operation</label>
        <select
          id="operation"
          name="operation"
          value={operation}
          onChange={(event) => setOperation(event.target.value as Operation)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        >
          <option value="increase">Increase stock</option>
          <option value="decrease">Decrease stock</option>
          <option value="set">Set exact quantity</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="quantity" className="text-sm font-semibold text-slate-700">
          {operation === "set" ? "New stock quantity" : "Quantity to change"}
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={operation === "set" ? 0 : 1}
          step="1"
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-semibold text-slate-700">Reason</label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={4}
          placeholder="Purchase receipt, damaged stock, stock count correction..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
