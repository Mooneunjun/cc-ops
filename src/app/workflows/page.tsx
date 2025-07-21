"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Hash,
  Plus,
  Edit3,
  Trash2,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Search,
  LayoutGrid,
  TableProperties,
  FileText,
  Play,
  Pause,
} from "lucide-react";
import { useState } from "react";

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

// 상태 설정
const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700",
    icon: PlayCircle,
    text: "Active",
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700",
    icon: PauseCircle,
    text: "Paused",
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
    text: "Completed",
  },
  error: {
    label: "Error",
    color: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700",
    icon: AlertCircle,
    text: "Error",
  },
};

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
                <CardDescription className="mt-2">
                  {message.message}
                </CardDescription>
              </div>
              <CardAction>
                <div className="flex gap-1">
                  {/* Pause/Resume 버튼 */}
                  {(message.status === "active" ||
                    message.status === "paused") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleAction(
                          message.status === "active" ? "pause" : "resume",
                          message.id,
                          message.status
                        )
                      }
                    >
                      {message.status === "active" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* 액션 드롭다운 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => handleAction("edit", message.id)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleAction("delete", message.id)}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardAction>
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
                <span>
                  {new Date(message.scheduledTime).toLocaleString("ko-KR")}
                </span>
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
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>채널</TableHead>
            <TableHead>예정 시간</TableHead>
            <TableHead>빈도</TableHead>
            <TableHead className="w-[120px]">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMessages.map((message) => (
            <TableRow key={message.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{message.title}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {message.message}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(message.status as keyof typeof statusConfig)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  {message.channel}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(message.scheduledTime).toLocaleString("ko-KR")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {message.frequency}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1 w-full">
                  {/* Pause/Resume 버튼을 위한 고정 공간 */}
                  <div className="w-8 flex justify-center">
                    {(message.status === "active" ||
                      message.status === "paused") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAction(
                            message.status === "active" ? "pause" : "resume",
                            message.id,
                            message.status
                          )
                        }
                      >
                        {message.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* 액션 드롭다운 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => handleAction("edit", message.id)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleAction("delete", message.id)}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
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
                  <BreadcrumbLink href="#">Workflows</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Scheduled</BreadcrumbPage>
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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />새 스케줄 추가
            </Button>
          </div>

          {/* 상태별 통계 */}
          <div className="flex items-center gap-6 text-sm">
            {(
              Object.entries(statusConfig) as [
                keyof typeof statusConfig,
                (typeof statusConfig)[keyof typeof statusConfig]
              ][]
            ).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span className="text-muted-foreground">{config.label}</span>
                <span className="font-medium">{getStatusCount(key)}</span>
              </div>
            ))}
          </div>

          {/* 검색 및 보기 형식 */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="메시지 제목, 내용, 채널로 검색..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="card" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  카드형
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <TableProperties className="h-4 w-4" />
                  테이블형
                </TabsTrigger>
                <TabsTrigger value="log" className="gap-2">
                  <FileText className="h-4 w-4" />
                  로그
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />첫 번째 스케줄 만들기
                </Button>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
