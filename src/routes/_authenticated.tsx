import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="md:pl-64">
        <Outlet />
      </div>
    </div>
  );
}
