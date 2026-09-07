import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { StorefrontHeader } from "@/components/storefront";
export default function SignupPage() { return <><StorefrontHeader /><main className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl font-black">Create account</h1><p className="mt-2 text-sm text-slate-500">Save your wishlist, cart, addresses, and orders.</p><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><AuthForm mode="signup" /></div><p className="mt-5 text-sm text-slate-500">Already registered? <Link href="/login" className="font-bold text-slate-900">Sign in</Link></p></main></>; }
