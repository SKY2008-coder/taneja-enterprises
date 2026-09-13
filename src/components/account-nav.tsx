import Link from "next/link";

export function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Account navigation">
      <p className="editorial-kicker mb-3">Your account</p>
      <Link href="/account">Overview</Link>
      <Link href="/account/profile">Profile</Link>
      <Link href="/account/addresses">Addresses</Link>
      <Link href="/account/orders">Orders</Link>
      <Link href="/wishlist">Wishlist</Link>
    </nav>
  );
}
