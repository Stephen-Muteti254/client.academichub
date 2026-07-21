import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { useLocation, Outlet } from "react-router-dom";

export default function ClientLayout({ noPadding }) {
  const location = useLocation();

  const disablePadding =
    noPadding ||
    location.pathname.includes("/client/chats") ||
    location.pathname.includes("/client/orders");

  return (
    <SidebarProvider>
      <div className="h-full flex w-full">
        <ClientSidebar />

        <main className="flex-1 flex flex-col h-full">
          <div className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4 lg:hidden">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-semibold">Client Dashboard</h2>
          </div>

          <div className={`flex-1 h-full ${disablePadding ? "p-0" : "p-2 lg:p-3"}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
