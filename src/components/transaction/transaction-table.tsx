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
import { TransactionFilters } from "./transaction-filters";
import { getCurrencyBySendingCountry } from "./transaction-utils";
import { InsightsTab } from "./insights-tab";
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
  const [baseSelectedCells, setBaseSelectedCells] =
    useState<Set<string> | null>(null);
  const [isAdditiveDrag, setIsAdditiveDrag] = useState(false);
  const [didDrag, setDidDrag] = useState(false);
  const [additiveMode, setAdditiveMode] = useState<"none" | "add" | "remove">(
    "none"
  );
  const [dragCurrent, setDragCurrent] = useState<{
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
    // If a drag gesture just finished, ignore the click to prevent unwanted toggle
    if (didDrag) {
      setDidDrag(false);
      return;
    }
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
    const additive = event.ctrlKey || event.metaKey;

    setIsDragging(true);
    setIsAdditiveDrag(additive);
    setDragStart({ year, month });
    setDidDrag(false);

    if (additive) {
      // Defer selection changes until the pointer moves; keep a snapshot
      const startCellId = getCellId(year, month);
      setBaseSelectedCells(new Set(selectedCells));
      setAdditiveMode(selectedCells.has(startCellId) ? "remove" : "add");
    } else {
      // Replace selection with starting cell immediately for normal drag
      setBaseSelectedCells(null);
      const newSelected = new Set<string>();
      newSelected.add(getCellId(year, month));
      setSelectedCells(newSelected);
      setAdditiveMode("none");
    }
  };

  const handleCellMouseEnter = (year: number, month: number) => {
    if (!isDragging || !dragStart) return;

    const startYear = Math.min(dragStart.year, year);
    const endYear = Math.max(dragStart.year, year);
    const startMonth = Math.min(dragStart.month, month);
    const endMonth = Math.max(dragStart.month, month);

    const rectCells: string[] = [];
    for (let y = startYear; y <= endYear; y++) {
      for (let m = startMonth; m <= endMonth; m++) {
        rectCells.push(getCellId(y, m));
      }
    }

    let nextSelection: Set<string>;
    if (isAdditiveDrag && baseSelectedCells) {
      nextSelection = new Set(baseSelectedCells);
      if (additiveMode === "add") {
        // Union: include all cells in rectangle
        for (const cell of rectCells) {
          nextSelection.add(cell);
        }
      } else if (additiveMode === "remove") {
        // Subtract: remove cells in rectangle from selection
        for (const cell of rectCells) {
          nextSelection.delete(cell);
        }
      } else {
        // Fallback (should not happen): behave like union
        for (const cell of rectCells) {
          nextSelection.add(cell);
        }
      }
    } else {
      // Replace selection with rectangle
      nextSelection = new Set<string>(rectCells);
    }

    // Mark that an actual drag occurred if we moved beyond the origin cell
    if (year !== dragStart.year || month !== dragStart.month) {
      setDidDrag(true);
    }

    // Track current drag cursor for visual preview
    setDragCurrent({ year, month });

    setSelectedCells(nextSelection);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsAdditiveDrag(false);
    setDragStart(null);
    setBaseSelectedCells(null);
    setAdditiveMode("none");
    setDragCurrent(null);
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
  const uniqueStatuses: string[] = useMemo<string[]>(() => {
    const statuses = (data.rows?.map((row: any) => row.status) ?? []).filter(
      (s: unknown): s is string => typeof s === "string" && s.length > 0
    );
    return Array.from(new Set(statuses));
  }, [data]);
  // 고유한 수취인 목록 추출 (빈값 제외)
  const uniqueRecipients: string[] = useMemo<string[]>(() => {
    const recipients = (
      data.rows?.map((row: any) => row.reciFullName) ?? []
    ).filter(
      (name: unknown): name is string =>
        typeof name === "string" && name.trim() !== ""
    );
    return Array.from(new Set(recipients));
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
        const amount = Number(row.localSourceAmt ?? row.sourceAmt) || 0;
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
      pivotData[year] = {} as Record<number, { count: number; amount: number }>;
      for (let month = 1; month <= 12; month++) {
        pivotData[year][month] = { count: 0, amount: 0 };
      }
    }

    completedTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.finished);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const amount =
        Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;

      if (pivotData[year] && pivotData[year][month]) {
        pivotData[year][month].count += 1;
        pivotData[year][month].amount += amount;
      }
    });

    const selectedCounts: number[] = [];
    const selectedAmounts: number[] = [];
    selectedCells.forEach((cellId) => {
      const [yearStr, monthStr] = cellId.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      if (pivotData[year] && pivotData[year][month]) {
        const { count, amount } = pivotData[year][month];
        selectedCounts.push(count);
        if (amount > 0) {
          selectedAmounts.push(amount);
        }
      }
    });

    if (statisticType === "count") {
      return selectedCounts.reduce((sum, c) => sum + c, 0);
    }

    if (selectedAmounts.length === 0) return 0;

    switch (statisticType) {
      case "sum":
        return selectedAmounts.reduce((sum, val) => sum + val, 0);
      case "avg":
        return Math.round(
          selectedAmounts.reduce((sum, val) => sum + val, 0) /
            selectedAmounts.length
        );
      case "max":
        return Math.max(...selectedAmounts);
      case "min":
        return Math.min(...selectedAmounts);
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
    const sidebarWidth = state === "expanded" ? "18rem" : "0rem";
    return `calc(100vw - ${sidebarWidth} - 2rem)`;
  };
  return (
    <>
      {/* 필터 섹션 */}
      <Card>
        <CardContent className="space-y-6">
          <TransactionFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onClearFilters={clearFilters}
            uniqueStatuses={uniqueStatuses}
            selectedStatuses={selectedStatuses}
            onStatusToggle={handleStatusChange}
            uniqueRecipients={uniqueRecipients}
            selectedRecipients={selectedRecipients}
            onRecipientToggle={handleRecipientChange}
            minAmount={minAmount}
            maxAmount={maxAmount}
            onMinAmountChange={(v) => {
              setMinAmount(v);
              setCurrentPage(1);
            }}
            onMaxAmountChange={(v) => {
              setMaxAmount(v);
              setCurrentPage(1);
            }}
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range);
              setCurrentPage(1);
            }}
          />
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
                  총 로컬 송금금액
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
                        const amount =
                          Number(
                            transaction.localSourceAmt ?? transaction.sourceAmt
                          ) || 0;
                        return sum + amount;
                      }, 0)
                  )}{" "}
                  {getCurrencyBySendingCountry(
                    filteredData.find((t: any) => t.send)?.send
                  )}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  1회 최대 로컬 송금금액
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
                        (t: any) => Number(t.localSourceAmt ?? t.sourceAmt) || 0
                      )
                    );
                    return formatAmount(maxAmount);
                  })()}{" "}
                  {getCurrencyBySendingCountry(
                    filteredData.find((t: any) => t.send)?.send
                  )}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  1건 평균 로컬 송금금액
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
                        const amount =
                          Number(
                            transaction.localSourceAmt ?? transaction.sourceAmt
                          ) || 0;
                        return sum + amount;
                      },
                      0
                    );
                    const avgAmount =
                      totalAmount / completedTransactions.length;
                    return formatAmount(Math.round(avgAmount));
                  })()}{" "}
                  {getCurrencyBySendingCountry(
                    filteredData.find((t: any) => t.send)?.send
                  )}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  중위 로컬 송금금액
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
                      .map(
                        (t: any) => Number(t.localSourceAmt ?? t.sourceAmt) || 0
                      )
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
                  {getCurrencyBySendingCountry(
                    filteredData.find((t: any) => t.send)?.send
                  )}
                </div>
                <p className="text-xs text-muted-foreground">지급완료 기준</p>
              </CardContent>
            </Card>
          </div>

          {/* 테이블 */}
          <div className="rounded-lg border w-full min-w-0">
            <div className="overflow-x-auto w-full min-w-0">
              <Table className="min-w-max whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">송금번호</TableHead>
                    <TableHead className="text-center">지급참조번호</TableHead>
                    <TableHead className="text-center">송금국가</TableHead>
                    <TableHead className="text-center">입금방식</TableHead>
                    <TableHead className="text-center">지급국가</TableHead>
                    <TableHead className="text-right">로컬 송금금액</TableHead>
                    <TableHead className="text-center">송금상태</TableHead>
                    <TableHead className="text-right">수취인명</TableHead>
                    <TableHead className="text-right">지급 완료일시</TableHead>
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
                          {formatAmount(
                            transaction.localSourceAmt ?? transaction.sourceAmt
                          )}{" "}
                          {getCurrencyBySendingCountry(transaction.send)}
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
          <InsightsTab filteredData={filteredData} />
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
