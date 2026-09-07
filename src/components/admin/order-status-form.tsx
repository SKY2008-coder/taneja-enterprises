"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { changeOrderStatusAction } from "@/app/admin/orders/actions";

type OrderStatus = "new" | "confirmed" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="rounded-xl bg-[#172d27] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving..." : "Update status"}</button>;
}

export function OrderStatusForm({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const transitions = allowedTransitions[currentStatus];
  const [status, setStatus] = useState<OrderStatus | "">(transitions[0] ?? "");
  const isDestructive = ["cancelled", "returned", "refunded"].includes(status);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (isDestructive && !window.confirm(`Confirm changing this order to ${status}. This may restore inventory or affect customer processing.`)) {
      event.preventDefault();
      return;
    }
    if (!status) event.preventDefault();
  }

  return (
    <form action={changeOrderStatusAction} onSubmit={submit} className="space-y-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="confirmed" value={isDestructive ? "true" : "false"} />
      <select name="status" value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} disabled={!transitions.length} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:opacity-60">
        {!transitions.length ? <option value="">No valid next status</option> : null}
        {transitions.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}</option>)}
      </select>
      <textarea name="note" rows={3} placeholder="Optional reason or status note" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
      <SubmitButton />
    </form>
  );
}
