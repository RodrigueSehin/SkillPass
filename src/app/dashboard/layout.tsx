import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireUser } from "@/lib/auth/current-user";

export default async function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  return <DashboardLayout userName={user.name}>{children}</DashboardLayout>;
}
