import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AccountNav } from "@/components/account-nav";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  async function signOut() {
    "use server";
    const client = await createServerSupabaseClient();
    await client.auth.signOut();
    redirect("/");
  }

  return <><StorefrontHeader /><main className="page-wrap"><div className="account-layout"><div><AccountNav /><form action={signOut}><button className="account-signout">Sign out</button></form></div><section className="account-main"><p className="editorial-kicker">Customer space</p><h1 className="mt-4">Welcome<br />back.</h1><p className="body-copy mt-6 max-w-lg">{user.email}</p><div className="account-cards"><Link href="/account/orders" className="account-card"><span>01</span><span>Orders <span>↗</span></span></Link><Link href="/account/addresses" className="account-card"><span>02</span><span>Addresses <span>↗</span></span></Link><Link href="/account/profile" className="account-card"><span>03</span><span>Profile <span>↗</span></span></Link><Link href="/wishlist" className="account-card"><span>04</span><span>Wishlist <span>↗</span></span></Link></div></section></div></main><StorefrontFooter /></>;
}
