"use client";

import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { memo, useEffect } from "react";
import { useAuthQuery } from "@/hooks/use-auth-query";

interface ConditionalSidebarProps {
  children: React.ReactNode;
}

// 사이드바를 메모이제이션하여 불필요한 재랜더링 방지
const MemoizedSidebar = memo(function MemoizedSidebar() {
  return <AppSidebar />;
});

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { user, loading } = useAuthQuery();
  const router = useRouter();

  // 비로그인 리다이렉트는 이펙트에서 처리
  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login");
    }
  }, [loading, user, isLoginPage, router]);

  // 로그인 페이지는 인증 여부와 무관하게 자식만 렌더
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 로딩 중이거나 리다이렉트 대기 중에는 전체 레이아웃 노출 금지
  if (loading || (!user && !isLoginPage)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <MemoizedSidebar />
      {children}
    </SidebarProvider>
  );
}
