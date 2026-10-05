import { Sidebar } from "./sidebar";
import { Topbar, type TopbarUser } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface DashboardLayoutProps {
  user: TopbarUser;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  return (
    <div className="to-background min-h-screen bg-gradient-to-b from-[#f3f7ff]">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar user={user} />
        <main className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
