import { SidebarInset } from "@/components/ui/sidebar";

export default function Loading() {
  return (
    <SidebarInset>
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Analytics...</p>
        </div>
      </div>
    </SidebarInset>
  );
}