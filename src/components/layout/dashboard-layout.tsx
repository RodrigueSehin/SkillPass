import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface DashboardLayoutProps {
  userName: string;
  children: React.ReactNode;
}

export function DashboardLayout({ userName, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar userName={userName} />
        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
