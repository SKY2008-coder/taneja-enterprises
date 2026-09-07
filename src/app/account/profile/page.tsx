import { updateProfileAction } from "@/app/storefront-actions";
import Link from "next/link";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";
import { getProfile } from "@/lib/supabase/storefront";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const data = await getProfile();
  if (!data) redirect("/login?next=/account/profile");
  return <><StorefrontHeader /><main className="page-wrap"><div className="account-layout"><nav className="account-nav"><p className="editorial-kicker mb-3">Your account</p><Link href="/account">Overview</Link><Link href="/account/addresses">Addresses</Link><Link href="/account/orders">Orders</Link><Link href="/wishlist">Wishlist</Link></nav><section className="account-main"><p className="editorial-kicker">Account / Profile</p><h1 className="mt-4">Your details.</h1><form action={updateProfileAction} className="editorial-panel mt-10 max-w-xl space-y-5 p-6 sm:p-8"><label className="block text-xs font-bold uppercase tracking-[.1em] text-[var(--plum)]">Email<input disabled value={data.user.email ?? ""} className="editorial-input mt-2 opacity-60" /></label><label className="block text-xs font-bold uppercase tracking-[.1em] text-[var(--plum)]">Name<input name="full_name" defaultValue={data.profile?.full_name ?? ""} className="editorial-input mt-2" /></label><label className="block text-xs font-bold uppercase tracking-[.1em] text-[var(--plum)]">Mobile<input name="phone" defaultValue={data.profile?.phone ?? ""} className="editorial-input mt-2" /></label><button className="editorial-button">Save profile</button></form></section></div></main><StorefrontFooter /></>;
}
