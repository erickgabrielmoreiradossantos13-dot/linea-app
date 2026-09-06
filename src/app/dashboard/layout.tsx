import { getCurrentBusiness } from "@/lib/supabase/business";
import { isLineaStaff } from "@/lib/staff";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ business, userEmail }, staff] = await Promise.all([getCurrentBusiness(), isLineaStaff()]);

  return (
    <div className="flex min-h-screen bg-[#fafafa] print:bg-white">
      <div className="print:hidden">
        <Sidebar isStaff={staff} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <Topbar businessName={business.name} userEmail={userEmail} isStaff={staff} />
        </div>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
