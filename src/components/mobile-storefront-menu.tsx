"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function MobileStorefrontMenu() {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="mobile-menu-button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X size={19} /> : <Menu size={19} />}</button>{open ? <nav className="mobile-menu" aria-label="Mobile navigation"><Link href="/" onClick={() => setOpen(false)}>Home</Link><Link href="/products" onClick={() => setOpen(false)}>Shop</Link><Link href="/categories" onClick={() => setOpen(false)}>Categories</Link><Link href="/search" onClick={() => setOpen(false)}>Search</Link><Link href="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link><Link href="/cart" onClick={() => setOpen(false)}>Cart</Link><Link href="/account" onClick={() => setOpen(false)}>Account</Link><a href="tel:9050150901" onClick={() => setOpen(false)}>Contact</a></nav> : null}</>;
}
