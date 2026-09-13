"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function AuthForm({ mode, redirectTo = "/account" }: { mode: "login" | "signup"; redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); const supabase = createClient(); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }); if (result.error) { setError(result.error.message); setLoading(false); return; } router.replace(redirectTo); router.refresh(); }
  return <form onSubmit={submit} className="space-y-4">{mode === "signup" ? <label className="auth-field"><span>Full name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="editorial-input" /></label> : null}<label className="auth-field"><span>Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="editorial-input" /></label><label className="auth-field"><span>Password</span><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="editorial-input" /></label>{error ? <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<button disabled={loading} className="editorial-button w-full disabled:opacity-60">{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button></form>;
}
