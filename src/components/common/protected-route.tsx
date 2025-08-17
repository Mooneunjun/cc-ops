"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthQuery } from "@/hooks/use-auth-query";

interface ProtectedRouteProps {
  children: React.ReactNode;
  showFullScreenLoader?: boolean;
}

export function ProtectedRoute({
  children,
  showFullScreenLoader = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuthQuery();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // 클라이언트에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isClient]);

  // 서버 사이드 렌더링 중이거나 하이드레이션 전에는 children을 그대로 반환
  if (!isClient) {
    return <>{children}</>;
  }

  // 클라이언트에서만 로딩 상태 처리
  if (loading) {
    if (showFullScreenLoader) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    // 콘텐츠 영역만 로딩 (사이드바 레이아웃 유지)
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
