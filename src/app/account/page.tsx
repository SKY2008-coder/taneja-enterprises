import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  return <><StorefrontHeader /><main className="page-wrap"><div className="account-layout"><nav className="account-nav"><p className="editorial-kicker mb-3">Your account</p><Link href="/account">Overview</Link><Link href="/account/profile">Profile</Link><Link href="/account/addresses">Addresses</Link><Link href="/account/orders">Orders</Link><Link href="/wishlist">Wishlist</Link><form action={async () => { "use server"; const client = await createServerSupabaseClient(); await client.auth.signOut(); redirect("/"); }}><button>Sign out</button></form></nav><section className="account-main"><p className="editorial-kicker">Customer space</p><h1 className="mt-4">Welcome<br />back.</h1><p className="body-copy mt-6 max-w-lg">{user.email}</p><div className="account-cards"><Link href="/account/orders" className="account-card"><span>01</span><span>Orders <span>↗</span></span></Link><Link href="/account/addresses" className="account-card"><span>02</span><span>Addresses <span>↗</span></span></Link><Link href="/account/profile" className="account-card"><span>03</span><span>Profile <span>↗</span></span></Link><Link href="/wishlist" className="account-card"><span>04</span><span>Wishlist <span>↗</span></span></Link></div></section></div></main><StorefrontFooter /></>;
}
