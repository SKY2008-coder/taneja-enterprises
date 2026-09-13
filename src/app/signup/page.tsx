import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";

function safeRedirect(value: string | undefined) { return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account"; }

export default async function SignupPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) { const params = (await searchParams) ?? {}; const redirectTo = safeRedirect(params.next); return <><StorefrontHeader /><main className="auth-layout"><section className="auth-intro"><p className="editorial-kicker">Taneja Enterprises</p><h1 className="mt-8">Make it<br />yours.</h1><p className="mt-8 max-w-sm text-sm leading-7 text-[#ddcac8]">Save your wishlist, cart, addresses and professional order history.</p></section><section className="auth-form-wrap"><div><p className="editorial-kicker">Join the catalogue</p><h2 className="mt-4">Create account.</h2><div className="mt-8"><AuthForm mode="signup" redirectTo={redirectTo} /></div><p className="mt-6 text-sm text-[var(--muted)]">Already registered? <Link href={`/login?next=${encodeURIComponent(redirectTo)}`} className="font-bold text-[var(--plum)]">Sign in</Link></p></div></section></main><StorefrontFooter /></>; }
