import { BusinessLogo } from "@/components/business/business-logo";

/** Plain layout for the pages a person sees before they have an organization. */
export default function BusinessSetupLayout({ children }: LayoutProps<"/business">) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f7ff] to-white">
      <header className="bg-gradient-to-r from-[#0a1d4d] to-[#0e2a6b]">
        <div className="mx-auto flex h-20 max-w-5xl items-center px-4">
          <BusinessLogo href="/business" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
    </div>
  );
}
