import { redirect } from "next/navigation";
import { getCurrentProfileRole } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getCurrentProfileRole();

  if (!user || !isAdmin) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
