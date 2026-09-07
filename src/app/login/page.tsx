import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { StorefrontHeader } from "@/components/storefront";
export default function LoginPage() { return <><StorefrontHeader /><main className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl font-black">Sign in</h1><p className="mt-2 text-sm text-slate-500">Access your Taneja Enterprises account.</p><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><AuthForm mode="login" /></div><p className="mt-5 text-sm text-slate-500">New customer? <Link href="/signup" className="font-bold text-slate-900">Create an account</Link></p></main></>; }
