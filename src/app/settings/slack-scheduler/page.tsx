"use client";

import { useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Clock, Hash, Calendar } from "lucide-react";
import { ScheduleModal } from "@/components/schedule-modal";
import { ActionButtons } from "@/components/action-buttons";
import { StatusStats, statusConfig } from "@/components/status-stats";
import { SearchAndViewToggle } from "@/components/search-and-view-toggle";

// Mock 데이터
const scheduledMessages = [
  {
    id: 1,
    title: "주간 팀 미팅 리마인더",
    message:
      "안녕하세요! 내일 오후 2시 주간 팀 미팅이 예정되어 있습니다. 회의실 A에서 진행됩니다.",
    channel: "#general",
    scheduledTime: "2024-01-15 13:00",
    status: "active",
    frequency: "매주 월요일",
  },
  {
    id: 2,
    title: "프로젝트 진행 상황 체크",
    message:
      "프로젝트 진행 상황을 공유해주세요. 현재 진행도와 이슈사항이 있다면 알려주세요.",
    channel: "#dev-team",
    scheduledTime: "2024-01-16 10:30",
    status: "active",
    frequency: "매일",
  },
  {
    id: 3,
    title: "점심시간 안내",
    message: "점심시간입니다! 맛있는 점심 드세요 🍽️",
    channel: "#random",
    scheduledTime: "2024-01-15 12:00",
    status: "completed",
    frequency: "매일",
  },
  {
    id: 4,
    title: "보안 업데이트 알림",
    message:
      "시스템 보안 업데이트가 예정되어 있습니다. 오늘 저녁 6시부터 1시간 동안 시스템 점검이 있을 예정입니다.",
    channel: "#announcements",
    scheduledTime: "2024-01-15 17:00",
    status: "paused",
    frequency: "월 1회",
  },
  {
    id: 5,
    title: "API 연결 오류 알림",
    message: "외부 API 연결에 실패했습니다. 관리자에게 문의하세요.",
    channel: "#alerts",
    scheduledTime: "2024-01-15 09:00",
    status: "error",
    frequency: "오류 발생시",
  },
];

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("card");

  const filteredMessages = scheduledMessages.filter(
    (message) =>
      message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCount = (status: keyof typeof statusConfig) =>
    scheduledMessages.filter((msg) => msg.status === status).length;

  const getStatusBadge = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;
    return (
      <Badge className={`gap-1 border-0 ${config.badgeClass}`}>
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAction = (
    action: string,
    messageId: number,
    currentStatus?: string
  ) => {
    console.log(
      `${action} message ${messageId}${
        currentStatus ? ` (current: ${currentStatus})` : ""
      }`
    );
  };

  const renderCardView = () => (
    <div className="grid gap-4">
      {filteredMessages.map((message) => (
        <Card key={message.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{message.title}</CardTitle>
                  {getStatusBadge(message.status as keyof typeof statusConfig)}
                </div>
                <CardDescription className="mt-2 line-clamp-2">
                  {message.message}
                </CardDescription>
              </div>
              <ActionButtons message={message} onAction={handleAction} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                <span>{message.channel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(message.scheduledTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{message.frequency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%] px-4">제목</TableHead>
            <TableHead className="w-[10%] px-4">상태</TableHead>
            <TableHead className="w-[12%] px-4">채널</TableHead>
            <TableHead className="w-[20%] px-4">예정 시간</TableHead>
            <TableHead className="w-[15%] px-4">빈도</TableHead>
            <TableHead className="w-[18%] px-4 text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMessages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center px-4">
                {searchTerm
                  ? "검색 결과가 없습니다."
                  : "예정된 메시지가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            filteredMessages.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="px-4">
                  <div className="space-y-1">
                    <p className="font-medium text-sm leading-none">
                      {message.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {getStatusBadge(message.status as keyof typeof statusConfig)}
                </TableCell>
                <TableCell className="px-4">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {message.channel}
                  </code>
                </TableCell>
                <TableCell className="px-4">
                  <div className="text-sm">
                    {formatDateTime(message.scheduledTime)}
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <span className="text-xs text-muted-foreground">
                    {message.frequency}
                  </span>
                </TableCell>
                <TableCell className="px-4">
                  <ActionButtons message={message} onAction={handleAction} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Slack-Scheduler</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                예정된 메시지
              </h1>
              <p className="text-muted-foreground">
                슬랙 메시지 자동화 스케줄을 관리하세요
              </p>
            </div>

            <ScheduleModal>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />새 스케줄 추가
              </Button>
            </ScheduleModal>
          </div>

          {/* 상태별 통계 */}
          <StatusStats getStatusCount={getStatusCount} />

          {/* 검색 및 보기 형식 */}
          <SearchAndViewToggle
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* 메시지 리스트 */}
          {viewMode === "card" && renderCardView()}
          {viewMode === "table" && renderTableView()}
          {viewMode === "log" && (
            <div className="text-center py-16 text-muted-foreground">
              로그 뷰는 곧 구현될 예정입니다.
            </div>
          )}

          {/* 빈 상태 */}
          {filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm
                  ? "검색 결과가 없습니다"
                  : "예정된 메시지가 없습니다"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm
                  ? "다른 검색어를 사용해보세요"
                  : "새로운 슬랙 메시지 자동화 스케줄을 추가해보세요"}
              </p>
              {!searchTerm && (
                <ScheduleModal>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />첫 번째 스케줄 만들기
                  </Button>
                </ScheduleModal>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
