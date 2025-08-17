"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthQuery } from "@/hooks/use-auth-query";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Home() {
  const { user, loading } = useAuthQuery();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/analytics/tx-analysis");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  // 인증 확인 중일 때 사이드바는 유지하고 메인 영역만 로딩
  if (loading) {
    return (
      <SidebarInset>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return null;
}
