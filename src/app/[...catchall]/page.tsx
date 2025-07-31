import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

// 유효한 라우트 목록
const VALID_ROUTES = [
  "analytics",
  "analytics/tx-analysis",
  "analytics/history",
  "settings",
  "settings/general",
  "settings/team",
  "settings/billing",
  "settings/limits",
  "settings/slack-scheduler",
  "docs",
  "docs/introduction",
  "docs/get-started",
  "docs/tutorials",
  "docs/changelog",
];

interface CatchAllPageProps {
  params: {
    catchall: string[];
  };
}

export default function CatchAllPage({ params }: CatchAllPageProps) {
  const requestedPath = params.catchall.join("/");

  // 모든 무효한 라우트에 대해 커스텀 404 페이지를 정상 페이지로 렌더링
  return (
    <SidebarInset
      className="bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 h-[calc(100dvh-1rem)]"
      style={{ width: "100%" }}
    >
      {/* 헤더 */}
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>404 - Not Found</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
          <div className="text-center space-y-6 max-w-md">
            {/* 404 숫자 */}
            <h1 className="text-6xl font-bold text-foreground">404</h1>

            {/* 제목 */}
            <h2 className="text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>

            {/* 디버그 정보 (개발시에만) */}
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-muted-foreground mt-4">
                Requested: /{requestedPath}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
