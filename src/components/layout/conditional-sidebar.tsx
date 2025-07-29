"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { memo } from 'react';

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

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <MemoizedSidebar />
      {children}
    </SidebarProvider>
  );
}