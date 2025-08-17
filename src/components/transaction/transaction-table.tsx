"use client";
import React, { useState, useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Filter,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { TransactionDetailModal } from "./transaction-detail-modal";
import { ChartsTab } from "./charts-tab";
import { StatusBadge } from "./status-badge";
import { SearchFilter } from "./search-filter";
interface TransactionTableProps {
  data: any;
}
export function TransactionTable({ data }: TransactionTableProps) {
  const { state, isMobile } = useSidebar();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  // Pagination 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(20);

  // 탭 상태
  const [activeTab, setActiveTab] = useState("statistics");

  // 피벗테이블 셀 선택 상태
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const [statisticType, setStatisticType] = useState<
    "sum" | "avg" | "max" | "min" | "count"
  >("sum");

  // 셀 선택 관련 함수들
  const getCellId = (year: number, month: number) => `${year}-${month}`;

  const handleCellClick = (
    year: number,
    month: number,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    const cellId = getCellId(year, month);
    const newSelectedCells = new Set(selectedCells);

    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd 클릭: 토글 선택
      if (newSelectedCells.has(cellId)) {
        newSelectedCells.delete(cellId);
      } else {
        newSelectedCells.add(cellId);
      }
    } else {
      // 일반 클릭: 단일 선택
      newSelectedCells.clear();
      newSelectedCells.add(cellId);
    }

    setSelectedCells(newSelectedCells);
  };

  const handleCellMouseDown = (
    year: number,
    month: number,
    event: React.MouseEvent
  ) => {
    if (event.ctrlKey || event.metaKey) return;

    setIsDragging(true);
    setDragStart({ year, month });
    const cellId = getCellId(year, month);
    const newSelectedCells = new Set<string>();
    newSelectedCells.add(cellId);
    setSelectedCells(newSelectedCells);
  };

  const handleCellMouseEnter = (year: number, month: number) => {
    if (!isDragging || !dragStart) return;

    const newSelectedCells = new Set<string>();
    const startYear = Math.min(dragStart.year, year);
    const endYear = Math.max(dragStart.year, year);
    const startMonth = Math.min(dragStart.month, month);
    const endMonth = Math.max(dragStart.month, month);

    for (let y = startYear; y <= endYear; y++) {
      for (let m = startMonth; m <= endMonth; m++) {
        newSelectedCells.add(getCellId(y, m));
      }
    }

    setSelectedCells(newSelectedCells);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };
  const formatAmount = (amount: string | number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR").format(Number(amount));
  };
  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };
  // 고유한 송금상태 목록 추출
  const uniqueStatuses = useMemo(() => {
    const statuses =
      data.rows?.map((row: any) => row.status).filter(Boolean) || [];
    return [...new Set(statuses)];
  }, [data]);
  // 고유한 수취인 목록 추출 (빈값 제외)
  const uniqueRecipients = useMemo(() => {
    const recipients =
      data.rows
        ?.map((row: any) => row.reciFullName)
        .filter((name: any) => name && name.trim() !== "") || [];
    return [...new Set(recipients)];
  }, [data]);
  // 송금상태 체크박스 핸들러
  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses((prev) => [...prev, status]);
    } else {
      setSelectedStatuses((prev) => prev.filter((s) => s !== status));
    }
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };
  // 수취인 체크박스 핸들러
  const handleRecipientChange = (recipient: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipients((prev) => [...prev, recipient]);
    } else {
      setSelectedRecipients((prev) => prev.filter((r) => r !== recipient));
    }
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };
  // 필터 초기화
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatuses([]);
    setSelectedRecipients([]);
    setMinAmount("");
    setMaxAmount("");
    setDateRange(undefined);
    setCurrentPage(1); // 페이지도 초기화
  };
  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filtered = data.rows || [];
    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (row: any) =>
          row.no?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.reciFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.send?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.receive?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // 송금상태 필터
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((row: any) =>
        selectedStatuses.includes(row.status)
      );
    }
    // 수취인 필터
    if (selectedRecipients.length > 0) {
      filtered = filtered.filter((row: any) =>
        selectedRecipients.includes(row.reciFullName)
      );
    }
    // 금액 범위 필터
    if (minAmount || maxAmount) {
      filtered = filtered.filter((row: any) => {
        const amount = Number(row.sourceAmt) || 0;
        const min = minAmount ? Number(minAmount) : 0;
        const max = maxAmount ? Number(maxAmount) : Infinity;
        return amount >= min && amount <= max;
      });
    }
    // 날짜 범위 필터
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((row: any) => {
        const appliedDate = new Date(row.applied);
        const start = dateRange?.from || new Date(0);
        const end = dateRange?.to || new Date();
        return appliedDate >= start && appliedDate <= end;
      });
    }
    return filtered;
  }, [
    data.rows,
    searchTerm,
    selectedStatuses,
    selectedRecipients,
    minAmount,
    maxAmount,
    dateRange,
  ]);
  // Pagination 로직
  const totalItems = filteredData.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const paginatedData = useMemo(() => {
    if (itemsPerPage === "all") {
      return filteredData;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // 통계 계산 함수
  const calculateStatistic = useMemo(() => {
    const completedTransactions = filteredData.filter(
      (transaction: any) => transaction.status === "지급완료"
    );

    const yearsList = completedTransactions
      .map((t: any) => {
        const date = new Date(t.finished);
        return isNaN(date.getTime()) ? null : date.getFullYear();
      })
      .filter((year: number | null): year is number => year !== null);

    const years: number[] = Array.from(new Set<number>(yearsList)).sort(
      (a, b) => a - b
    );

    const pivotData: Record<
      number,
      Record<number, { count: number; amount: number }>
    > = {};
    for (const year of years) {
      pivotData[year] = {};
      for (let month = 1; month <= 12; month++) {
        pivotData[year][month] = { count: 0, amount: 0 };
      }
    }

    completedTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.finished);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const amount = Number(transaction.sourceAmt) || 0;

      if (pivotData[year] && pivotData[year][month]) {
        pivotData[year][month].count += 1;
        pivotData[year][month].amount += amount;
      }
    });

    const selectedValues: number[] = [];
    selectedCells.forEach((cellId) => {
      const [yearStr, monthStr] = cellId.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      if (pivotData[year] && pivotData[year][month]) {
        if (statisticType === "count") {
          selectedValues.push(pivotData[year][month].count);
        } else {
          selectedValues.push(pivotData[year][month].amount);
        }
      }
    });

    if (selectedValues.length === 0) return 0;

    switch (statisticType) {
      case "sum":
        return selectedValues.reduce((sum, val) => sum + val, 0);
      case "avg":
        return (
          selectedValues.reduce((sum, val) => sum + val, 0) /
          selectedValues.length
        );
      case "max":
        return Math.max(...selectedValues);
      case "min":
        return Math.min(...selectedValues);
      case "count":
        return selectedValues.length;
      default:
        return 0;
    }
  }, [selectedCells, statisticType, filteredData]);

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value === "all" ? "all" : parseInt(value));
    setCurrentPage(1);
  };
  // 사이드바 상태에 따른 너비 계산
  const getSidebarAwareMaxWidth = () => {
    // 모바일에서는 사이드바가 오버레이로 표시되므로 공간을 차지하지 않음
    // 데스크톱에서만 사이드바가 실제 공간을 차지함
    if (isMobile) {
      return `calc(100vw - 2rem)`;
    }
    // 데스크톱에서의 사이드바 너비 계산
    const sidebarWidth = state === "expanded" ? "16rem" : "0rem";
    return `calc(100vw - ${sidebarWidth} - 2rem)`;
  };
  return (
    <>
      {/* 필터 섹션 */}
      <Card>
        <CardContent className="space-y-6">
          {/* 검색 */}
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1); // 검색 시 첫 페이지로
            }}
            onClearFilters={clearFilters}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 송금상태 필터 */}
            <div className="space-y-2">
              <Label>송금상태</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedStatuses.length > 0
                      ? `${selectedStatuses.length}개 선택됨`
                      : "상태 선택"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-full"
                  style={{
                    width: "var(--radix-dropdown-menu-trigger-width, 240px)",
                  }}
                >
                  <DropdownMenuLabel>송금상태</DropdownMenuLabel>
                  {uniqueStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status as string}
                      checked={selectedStatuses.includes(status as string)}
                      onCheckedChange={(checked) =>
                        handleStatusChange(status as string, checked)
                      }
                      className="relative flex w-full cursor-default items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground [&>span]:!left-auto [&>span]:!right-2"
                    >
                      <StatusBadge status={status as string} />
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* 수취인 필터 */}
            <div className="space-y-2">
              <Label>수취인</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedRecipients.length > 0
                      ? `${selectedRecipients.length}명 선택됨`
                      : "수취인 선택"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-full max-h-64 overflow-y-auto"
                  style={{
                    width: "var(--radix-dropdown-menu-trigger-width, 240px)",
                  }}
                >
                  <DropdownMenuLabel>수취인</DropdownMenuLabel>
                  {uniqueRecipients.map((recipient) => (
                    <DropdownMenuCheckboxItem
                      key={recipient as string}
                      checked={selectedRecipients.includes(recipient as string)}
                      onCheckedChange={(checked) =>
                        handleRecipientChange(recipient as string, checked)
                      }
                      className="relative flex w-full cursor-default items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground [&>span]:!left-auto [&>span]:!right-2"
                    >
                      {recipient as string}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* 금액 범위 */}
            <div className="space-y-2">
              <Label>금액 범위</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <span className="flex items-center">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            {/* 날짜 범위 */}
            <div className="space-y-2">
              <Label>날짜 범위</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy/MM/dd", { locale: ko })}{" "}
                          - {format(dateRange.to, "yyyy/MM/dd", { locale: ko })}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy/MM/dd", { locale: ko })
                      )
                    ) : (
                      <span>날짜 범위 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setCurrentPage(1);
                    }}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 데이터 분석 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="insights">Insight</TabsTrigger>
          <TabsTrigger value="charts">Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  지급완료 기간
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {(() => {
                    const completedTransactions = filteredData.filter(
                      (transaction: any) => transaction.status === "지급완료"
                    );
                    if (completedTransactions.length === 0) return "-";
                    const dates = completedTransactions
                      .map((t: any) => new Date(t.finished))
                      .filter((date: Date) => !isNaN(date.getTime()))
                      .sort((a: Date, b: Date) => a.getTime() - b.getTime());
                    if (dates.length === 0) return "-";
                    const formatDate = (date: Date) => {
                      return date.toLocaleDateString("ko-KR", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      });
                    };
                    if (dates.length === 1) {
                      return formatDate(dates[0]);
                    }
                    return `${formatDate(dates[0])} ~ ${formatDate(
                      dates[dates.length - 1]
                    )}`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  총 송금건수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {
                    filteredData.filter(
                      (transaction: any) => transaction.status === "지급완료"
                    ).length
                  }
                  건
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  총 송금금액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {formatAmount(
                    filteredData
                      .filter(
                        (transaction: any) => transaction.status === "지급완료"
                      )
                      .reduce((sum: number, transaction: any) => {
                        const amount = Number(transaction.sourceAmt) || 0;
                        return sum + amount;
                      }, 0)
                  )}{" "}
                  {filteredData.find((t: any) => t.source)?.source || "KRW"}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  1회 최대 송금금액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {(() => {
                    const completedTransactions = filteredData.filter(
                      (transaction: any) => transaction.status === "지급완료"
                    );
                    if (completedTransactions.length === 0) return "0";
                    const maxAmount = Math.max(
                      ...completedTransactions.map(
                        (t: any) => Number(t.sourceAmt) || 0
                      )
                    );
                    return formatAmount(maxAmount);
                  })()}{" "}
                  {filteredData.find((t: any) => t.source)?.source || "KRW"}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  평균 송금금액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {(() => {
                    const completedTransactions = filteredData.filter(
                      (transaction: any) => transaction.status === "지급완료"
                    );
                    if (completedTransactions.length === 0) return "0";
                    const totalAmount = completedTransactions.reduce(
                      (sum: number, transaction: any) => {
                        const amount = Number(transaction.sourceAmt) || 0;
                        return sum + amount;
                      },
                      0
                    );
                    const avgAmount =
                      totalAmount / completedTransactions.length;
                    return formatAmount(Math.round(avgAmount));
                  })()}{" "}
                  {filteredData.find((t: any) => t.source)?.source || "KRW"}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  중위 송금금액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {(() => {
                    const completedTransactions = filteredData.filter(
                      (transaction: any) => transaction.status === "지급완료"
                    );
                    if (completedTransactions.length === 0) return "0";

                    const amounts = completedTransactions
                      .map((t: any) => Number(t.sourceAmt) || 0)
                      .sort((a: number, b: number) => a - b);

                    let median: number;
                    const mid = Math.floor(amounts.length / 2);

                    if (amounts.length % 2 === 0) {
                      // 짝수 개일 때: 중간 두 값의 평균
                      median = (amounts[mid - 1] + amounts[mid]) / 2;
                    } else {
                      // 홀수 개일 때: 중간 값
                      median = amounts[mid];
                    }

                    return formatAmount(Math.round(median));
                  })()}{" "}
                  {filteredData.find((t: any) => t.source)?.source || "KRW"}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
          </div>

          {/* 테이블 */}
          <div className="rounded-lg border">
            <div
              className="overflow-x-auto"
              style={{
                maxWidth: getSidebarAwareMaxWidth(),
              }}
            >
              <Table style={{ minWidth: "800px" }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">송금번호</TableHead>
                    <TableHead className="text-center">지급참조번호</TableHead>
                    <TableHead className="text-center">송금국가</TableHead>
                    <TableHead className="text-center">입금방식</TableHead>
                    <TableHead className="text-center">지급국가</TableHead>
                    <TableHead className="text-right">송금금액</TableHead>
                    <TableHead className="text-center">송금상태</TableHead>
                    <TableHead className="text-right">수취인명</TableHead>
                    <TableHead className="text-right">지급완료일시</TableHead>
                    <TableHead className="text-center">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        필터 조건에 맞는 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium font-mono text-center">
                          {transaction.no}
                        </TableCell>
                        <TableCell className="font-medium font-mono text-center">
                          {transaction.refNo || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {transaction.send}
                        </TableCell>
                        <TableCell className="text-center">
                          {transaction.paymentOption || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {transaction.receive}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(transaction.sourceAmt)}{" "}
                          {transaction.source}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={transaction.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.reciFullName || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatDateTime(transaction.finished)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="hidden sm:flex items-center space-x-4 flex-1">
                <p className="text-sm text-muted-foreground">
                  {itemsPerPage === "all" ||
                  filteredData.length <= Number(itemsPerPage)
                    ? `총 ${filteredData.length}건 중 ${filteredData.length}건 표시`
                    : `총 ${filteredData.length}건 중 ${
                        (currentPage - 1) * Number(itemsPerPage) + 1
                      }-${Math.min(
                        currentPage * Number(itemsPerPage),
                        filteredData.length
                      )}건 표시`}
                </p>
                <div className="flex items-center gap-2">
                  <Label htmlFor="items-per-page" className="text-sm">
                    페이지당:
                  </Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger id="items-per-page" className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20개</SelectItem>
                      <SelectItem value="50">50개</SelectItem>
                      <SelectItem value="100">100개</SelectItem>
                      <SelectItem value="all">전체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {itemsPerPage !== "all" && totalPages > 1 && (
                <div className="flex justify-center flex-1">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              <div className="hidden sm:block flex-1"></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <ChartsTab />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* 피벗테이블 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">월별/연도별 송금 분석</h3>
              <div className="flex items-center gap-4">
                {selectedCells.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedCells.size}개 셀 선택됨
                    </span>
                    <Select
                      value={statisticType}
                      onValueChange={(value: any) => setStatisticType(value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">합</SelectItem>
                        <SelectItem value="avg">평균</SelectItem>
                        <SelectItem value="max">최대</SelectItem>
                        <SelectItem value="min">최소</SelectItem>
                        <SelectItem value="count">개수</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm font-medium">
                      {statisticType === "count"
                        ? calculateStatistic
                        : formatAmount(calculateStatistic)}
                      {statisticType !== "count" &&
                        filteredData.find((t: any) => t.source)?.source &&
                        ` ${filteredData.find((t: any) => t.source)?.source}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className="rounded-md border"
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <Table className="table-fixed w-full [&_tr]:border-b-0 select-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center h-12 w-20 border-r border-dashed border-gray-300 bg-muted">
                      연도
                    </TableHead>
                    {(() => {
                      const monthNames = [
                        "1월",
                        "2월",
                        "3월",
                        "4월",
                        "5월",
                        "6월",
                        "7월",
                        "8월",
                        "9월",
                        "10월",
                        "11월",
                        "12월",
                      ];
                      return monthNames.map((monthName, index) => (
                        <TableHead
                          key={index}
                          className="text-center h-12 w-20 border-r border-dashed border-gray-300 bg-slate-50"
                        >
                          {monthName}
                        </TableHead>
                      ));
                    })()}
                    <TableHead className="text-center bg-muted h-12 w-24">
                      <div className="space-y-1">
                        <div>총계</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          건수 / 금액
                        </div>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const completedTransactions = filteredData.filter(
                      (transaction: any) => transaction.status === "지급완료"
                    );

                    // 연도별 데이터 구조화
                    const yearsList = completedTransactions
                      .map((t: any) => {
                        const date = new Date(t.finished);
                        return isNaN(date.getTime())
                          ? null
                          : date.getFullYear();
                      })
                      .filter(
                        (year: number | null): year is number => year !== null
                      );

                    const years: number[] = Array.from(
                      new Set<number>(yearsList)
                    ).sort((a, b) => a - b);

                    // 연도별 월별 데이터 구조화
                    const pivotData: Record<
                      number,
                      Record<number, { count: number; amount: number }>
                    > = {};

                    for (const year of years) {
                      pivotData[year] = {};
                      for (let month = 1; month <= 12; month++) {
                        pivotData[year][month] = { count: 0, amount: 0 };
                      }
                    }

                    // 데이터 집계
                    completedTransactions.forEach((transaction: any) => {
                      const date = new Date(transaction.finished);
                      if (isNaN(date.getTime())) return;

                      const year = date.getFullYear();
                      const month = date.getMonth() + 1;
                      const amount = Number(transaction.sourceAmt) || 0;

                      if (pivotData[year] && pivotData[year][month]) {
                        pivotData[year][month].count += 1;
                        pivotData[year][month].amount += amount;
                      }
                    });

                    return years.map((year: number) => {
                      const yearData = pivotData[year];

                      // 연도별 총계 계산
                      const yearTotal = Array.from(
                        { length: 12 },
                        (_, i) => i + 1
                      ).reduce(
                        (total, month) => {
                          return {
                            count: total.count + (yearData[month]?.count || 0),
                            amount:
                              total.amount + (yearData[month]?.amount || 0),
                          };
                        },
                        { count: 0, amount: 0 }
                      );

                      return (
                        <TableRow key={year.toString()}>
                          <TableCell className="font-medium bg-muted text-center border-r border-dashed border-gray-300">
                            {year}년
                          </TableCell>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (month) => {
                              const cellId = getCellId(year as number, month);
                              const isSelected = selectedCells.has(cellId);

                              return (
                                <TableCell
                                  key={month}
                                  className={`text-center border-r border-dashed border-gray-300 cursor-pointer transition-colors hover:bg-gray-100 ${
                                    isSelected
                                      ? "bg-blue-100 hover:bg-blue-200"
                                      : ""
                                  }`}
                                  onClick={(e) =>
                                    handleCellClick(year as number, month, e)
                                  }
                                  onMouseDown={(e) =>
                                    handleCellMouseDown(
                                      year as number,
                                      month,
                                      e
                                    )
                                  }
                                  onMouseEnter={() =>
                                    handleCellMouseEnter(year as number, month)
                                  }
                                >
                                  <div className="text-sm">
                                    <div>{yearData[month]?.count || 0}</div>
                                    <div className="text-muted-foreground">
                                      {formatAmount(
                                        yearData[month]?.amount || 0
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              );
                            }
                          )}
                          <TableCell className="text-center bg-muted">
                            <div className="text-sm font-medium">
                              <div>{yearTotal.count}</div>
                              <div className="text-muted-foreground">
                                {formatAmount(yearTotal.amount)}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                  {/* 월별 총계 행 */}
                  <TableRow className="bg-muted">
                    <TableCell className="font-bold text-center border-r border-dashed border-gray-300">
                      총계
                    </TableCell>
                    {(() => {
                      const completedTransactions = filteredData.filter(
                        (transaction: any) => transaction.status === "지급완료"
                      );

                      // 월별 총계 계산
                      const monthTotals = Array.from(
                        { length: 12 },
                        (_, i) => i + 1
                      ).map((month) => {
                        const monthTransactions = completedTransactions.filter(
                          (t: any) => {
                            const date = new Date(t.finished);
                            return (
                              !isNaN(date.getTime()) &&
                              date.getMonth() + 1 === month
                            );
                          }
                        );

                        return {
                          month,
                          count: monthTransactions.length,
                          amount: monthTransactions.reduce(
                            (sum: number, t: any) =>
                              sum + (Number(t.sourceAmt) || 0),
                            0
                          ),
                        };
                      });

                      // 전체 총계 계산
                      const grandTotal = {
                        count: completedTransactions.length,
                        amount: completedTransactions.reduce(
                          (sum: number, t: any) =>
                            sum + (Number(t.sourceAmt) || 0),
                          0
                        ),
                      };

                      return (
                        <>
                          {monthTotals.map((monthTotal) => (
                            <TableCell
                              key={monthTotal.month}
                              className="text-center border-r border-dashed border-gray-300"
                            >
                              <div className="text-sm font-bold">
                                <div>{monthTotal.count}</div>
                                <div className="text-muted-foreground">
                                  {formatAmount(monthTotal.amount)}
                                </div>
                              </div>
                            </TableCell>
                          ))}
                          <TableCell className="text-center bg-primary/10">
                            <div className="text-sm font-bold">
                              <div>{grandTotal.count}</div>
                              <div className="text-muted-foreground">
                                {formatAmount(grandTotal.amount)}
                              </div>
                            </div>
                          </TableCell>
                        </>
                      );
                    })()}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isDetailModalOpen}
        onClose={setIsDetailModalOpen}
      />
    </>
  );
}
