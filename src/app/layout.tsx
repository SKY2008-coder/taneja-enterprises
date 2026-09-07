import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taneja Enterprises | Wholesale Catalogue",
  description: "Browse Taneja Enterprises' live wholesale product catalogue.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="site-shell">{children}</body>
    </html>
  );
}
