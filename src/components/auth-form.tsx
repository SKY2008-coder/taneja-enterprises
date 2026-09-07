"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); const supabase = createClient(); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }); if (result.error) { setError(result.error.message); setLoading(false); return; } router.replace("/account"); router.refresh(); }
  return <form onSubmit={submit} className="space-y-4">{mode === "signup" ? <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /> : null}<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />{error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<button disabled={loading} className="w-full rounded-xl bg-[#172d27] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button></form>;
}
