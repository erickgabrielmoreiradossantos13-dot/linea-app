import { getCurrentBusiness } from "@/lib/supabase/business";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, userEmail } = await getCurrentBusiness();

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar businessName={business.name} userEmail={userEmail} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
