import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";

function safeRedirect(value: string | undefined) { return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account"; }

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) { const params = (await searchParams) ?? {}; const redirectTo = safeRedirect(params.next); return <><StorefrontHeader /><main className="auth-layout"><section className="auth-intro"><p className="editorial-kicker">Taneja Enterprises</p><h1 className="mt-8">Welcome<br />in.</h1><p className="mt-8 max-w-sm text-sm leading-7 text-[#ddcac8]">Your catalogue, your saved selections, your professional order history.</p></section><section className="auth-form-wrap"><div><p className="editorial-kicker">Customer account</p><h2 className="mt-4">Sign in.</h2><div className="mt-8"><AuthForm mode="login" redirectTo={redirectTo} /></div><p className="mt-6 text-sm text-[var(--muted)]">New customer? <Link href={`/signup?next=${encodeURIComponent(redirectTo)}`} className="font-bold text-[var(--plum)]">Create an account</Link></p></div></section></main><StorefrontFooter /></>; }
