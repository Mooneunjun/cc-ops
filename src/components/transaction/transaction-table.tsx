"use client";

import { useState, useMemo } from "react";
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
  DropdownMenuSeparator,
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
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { TransactionDetailModal } from "./transaction-detail-modal";
import type { DateRange } from "react-day-picker";

interface TransactionTableProps {
  data: any;
}

export function TransactionTable({ data }: TransactionTableProps) {
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "지급완료":
        return "bg-green-100 text-green-800";
      case "송금거절":
        return "bg-red-100 text-red-800";
      case "지급준비중":
        return "bg-blue-100 text-blue-800";
      case "지급진행중":
        return "bg-blue-100 text-blue-800";
      case "환불준비중":
        return "bg-yellow-100 text-yellow-800";
      case "환불완료":
        return "bg-purple-100 text-purple-800";
      case "환불진행중":
        return "bg-purple-100 text-purple-800";
      case "시간초과":
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value === "all" ? "all" : parseInt(value));
    setCurrentPage(1);
  };

  return (
    <>
      {/* 필터 섹션 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 검색 */}
          <div className="space-y-2">
            <Label htmlFor="search">검색</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="송금번호, 수취인명, 송금국가, 지급국가 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // 검색 시 첫 페이지로
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                          status as string
                        )}`}
                      >
                        {status as string}
                      </span>
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

          {/* 필터 액션 버튼 */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                총 {data.rows?.length || 0}건 중 {filteredData.length}건 표시
              </div>
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
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">송금번호</TableHead>
              <TableHead className="text-center">송금국가</TableHead>
              <TableHead className="text-center">지급국가</TableHead>
              <TableHead className="text-right">송금금액</TableHead>
              <TableHead className="text-center">송금상태</TableHead>
              <TableHead>수취인명</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead>지급완료일시</TableHead>
              <TableHead className="text-center">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
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
                  <TableCell className="text-center">
                    {transaction.send}
                  </TableCell>
                  <TableCell className="text-center">
                    {transaction.receive}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(transaction.sourceAmt)} {transaction.source}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.reciFullName || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(transaction.applied)}
                  </TableCell>
                  <TableCell className="text-sm">
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

      {/* Pagination */}
      {itemsPerPage !== "all" && totalPages > 1 && (
        <div className="mt-2">
          {/* Pagination - 중앙 배치 */}
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className={
                      currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {/* 페이지 번호들 */}
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxVisiblePages / 2)
                  );
                  let endPage = Math.min(
                    totalPages,
                    startPage + maxVisiblePages - 1
                  );

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  // 첫 페이지
                  if (startPage > 1) {
                    pages.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                          }}
                          isActive={currentPage === 1}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );

                    if (startPage > 2) {
                      pages.push(
                        <PaginationItem key="ellipsis1">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                  }

                  // 보이는 페이지들
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i);
                          }}
                          isActive={currentPage === i}
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // 마지막 페이지
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <PaginationItem key="ellipsis2">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                          isActive={currentPage === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  return pages;
                })()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* 정보 텍스트 */}
          <div className="flex justify-center mt-2 mb-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {totalItems > 0 && (
                <span>
                  {(currentPage - 1) * (itemsPerPage as number) + 1} -{" "}
                  {Math.min(currentPage * (itemsPerPage as number), totalItems)}{" "}
                  of {totalItems} 건
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isDetailModalOpen}
        onClose={setIsDetailModalOpen}
      />
    </>
  );
}
