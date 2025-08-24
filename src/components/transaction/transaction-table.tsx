"use client";
import React, { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { TransactionDetailModal } from "./transaction-detail-modal";
import { ChartsTab } from "./charts-tab";
import { StatusBadge } from "./status-badge";
import { TransactionFilters } from "./transaction-filters";
import { StatisticsCards } from "./statistics-cards";
import { AmountDisplay } from "./amount-display";
import { DateTimeDisplay } from "./datetime-display";
import { useTransactionFilter } from "./use-transaction-filter";
import { getCurrencyBySendingCountry } from "./transaction-utils";
import { InsightsTab } from "./insights-tab";
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

  // 탭 상태
  const [activeTab, setActiveTab] = useState("statistics");

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
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
  const filteredData = useTransactionFilter(data.rows, {
    searchTerm,
    selectedStatuses,
    selectedRecipients,
    minAmount,
    maxAmount,
    dateRange,
  });
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
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="insights">Insight</TabsTrigger>
            <TabsTrigger value="charts">Chart</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 모든 탭 내용을 항상 렌더링하고 CSS로 숨김처리 */}
        <div className={`space-y-4 mt-6 ${activeTab === "statistics" ? "block" : "hidden"}`}>
          <StatisticsCards filteredData={filteredData} />

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
                          <AmountDisplay
                            amount={
                              transaction.localSourceAmt ??
                              transaction.sourceAmt
                            }
                            currency={getCurrencyBySendingCountry(
                              transaction.send
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={transaction.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.reciFullName || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          <DateTimeDisplay dateTime={transaction.finished} />
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
        </div>

        <div className={`space-y-4 mt-6 ${activeTab === "charts" ? "block" : "hidden"}`}>
          <ChartsTab filteredData={filteredData} />
        </div>

        <div className={`space-y-4 mt-6 ${activeTab === "insights" ? "block" : "hidden"}`}>
          <InsightsTab filteredData={filteredData} />
        </div>
      </div>
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isDetailModalOpen}
        onClose={setIsDetailModalOpen}
      />
    </>
  );
}
