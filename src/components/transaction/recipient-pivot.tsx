"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatAmount } from "./transaction-utils";

type StatisticType = "sum" | "avg" | "max" | "min" | "count";

interface RecipientPivotProps {
  filteredData: any[];
}

export function RecipientPivot({ filteredData }: RecipientPivotProps) {
  // 모든 수취인 기본적으로 확장 상태
  const [expandedRecipients, setExpandedRecipients] = useState<Record<string, boolean>>({});
  
  // 모든 수취인을 기본적으로 확장 상태로 설정
  React.useEffect(() => {
    if (filteredData.length > 0) {
      const recipients = [...new Set(filteredData.map(t => (t.reciFullName || "").trim()).filter(Boolean))];
      const initialExpanded: Record<string, boolean> = {};
      recipients.forEach(recipient => {
        initialExpanded[recipient] = true;
      });
      setExpandedRecipients(initialExpanded);
    }
  }, [filteredData]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    recipient: string;
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
    recipient: string;
    year: number;
    month: number;
  } | null>(null);
  const [statisticType, setStatisticType] = useState<StatisticType>("sum");
  const [activeContextCell, setActiveContextCell] = useState<string | null>(
    null
  );
  
  // 드래그 throttling을 위한 ref
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // 로컬 토글 함수 (memoized)
  const toggleRecipient = useCallback((recipient: string) => {
    setExpandedRecipients(prev => ({
      ...prev,
      [recipient]: !prev[recipient]
    }));
  }, []);

  // 선택된 셀들의 금액 복사 함수
  const copySelectedCellsAmount = async () => {
    const amounts: number[] = [];
    selectedCells.forEach((cellId) => {
      const parts = cellId.split("-");
      if (parts.length < 3) return;

      const month = parseInt(parts[parts.length - 1], 10);
      const year = parseInt(parts[parts.length - 2], 10);
      const recipient = parts.slice(0, -2).join("-");

      if (isNaN(year) || isNaN(month)) return;

      // 해당 수취인의 해당 연도/월 데이터 찾기
      const group = groups.find((g) => g.recipient === recipient);
      if (!group) return;

      const yearRow = group.rows.find((r) => r.year === year);
      if (!yearRow) return;

      const monthData = yearRow.months[month];
      if (!monthData) return;

      if (monthData.amount > 0) amounts.push(monthData.amount);
    });

    const totalAmount = amounts.reduce((s, v) => s + v, 0);
    const formattedAmount = totalAmount.toLocaleString("ko-KR");

    try {
      await navigator.clipboard.writeText(formattedAmount);
    } catch {
      // fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = formattedAmount;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };


  // 수취인별 셀 ID 생성 (recipient-year-month 형식)
  const getCellId = (recipient: string, year: number, month: number) =>
    `${recipient}-${year}-${month}`;

  const handleCellClick = useCallback((
    recipient: string,
    year: number,
    month: number,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    if (didDrag) {
      setDidDrag(false);
      return;
    }
    const cellId = getCellId(recipient, year, month);
    const next = new Set(selectedCells);
    if (event.ctrlKey || event.metaKey) {
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
    } else {
      next.clear();
      next.add(cellId);
    }
    setSelectedCells(next);
  }, [didDrag, selectedCells]);

  const handleCellMouseDown = useCallback((
    recipient: string,
    year: number,
    month: number,
    event: React.MouseEvent
  ) => {
    const additive = event.ctrlKey || event.metaKey;
    setIsDragging(true);
    setIsAdditiveDrag(additive);
    setDragStart({ recipient, year, month });
    setDidDrag(false);
    if (additive) {
      const startCellId = getCellId(recipient, year, month);
      setBaseSelectedCells(new Set(selectedCells));
      setAdditiveMode(selectedCells.has(startCellId) ? "remove" : "add");
    } else {
      setBaseSelectedCells(null);
      const only = new Set<string>();
      only.add(getCellId(recipient, year, month));
      setSelectedCells(only);
      setAdditiveMode("none");
    }
  }, [selectedCells]);

  // handleCellMouseEnter는 useMemo 이후에 정의 (rowIndexMap, flatRows 접근 필요)

  const handleMouseUp = useCallback(() => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
    setIsDragging(false);
    setIsAdditiveDrag(false);
    setDragStart(null);
    setBaseSelectedCells(null);
    setAdditiveMode("none");
    setDragCurrent(null);
  }, []);
  
  // cleanup throttle on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  // 수취인-연도 행 구조와 월/연도/전체 합계, 건수 계산
  const {
    groups,
    flatRows,
    monthTotalsAmt,
    monthTotalsCnt,
    grandTotalAmt,
    grandTotalCnt,
    rowIndexMap,
  } = useMemo(() => {
    type MonthAgg = { amount: number; count: number };
    type YearRow = {
      recipient: string;
      year: number;
      months: Record<number, MonthAgg>;
      rowTotalAmt: number;
      rowTotalCnt: number;
    };
    type Group = { recipient: string; rows: YearRow[] };
    const recipientYearMap = new Map<string, Map<number, YearRow>>();
    const monthTotalsAmt: Record<number, number> = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i + 1, 0])
    );
    const monthTotalsCnt: Record<number, number> = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i + 1, 0])
    );
    let grandTotalAmt = 0;
    let grandTotalCnt = 0;

    filteredData.forEach((t: any) => {
      if (t.status !== "지급완료") return;
      const recipient = (t.reciFullName || "").trim();
      if (!recipient) return;
      const d = new Date(t.finished);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const amt = Number(t.localSourceAmt ?? t.sourceAmt) || 0;

      if (!recipientYearMap.has(recipient))
        recipientYearMap.set(recipient, new Map());
      const yearMap = recipientYearMap.get(recipient)!;
      if (!yearMap.has(y)) {
        yearMap.set(y, {
          recipient,
          year: y,
          months: Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [
              i + 1,
              { amount: 0, count: 0 },
            ])
          ) as Record<number, MonthAgg>,
          rowTotalAmt: 0,
          rowTotalCnt: 0,
        });
      }
      const yr = yearMap.get(y)!;
      yr.months[m].amount += amt;
      yr.months[m].count += 1;
      yr.rowTotalAmt += amt;
      yr.rowTotalCnt += 1;

      monthTotalsAmt[m] += amt;
      monthTotalsCnt[m] += 1;
      grandTotalAmt += amt;
      grandTotalCnt += 1;
    });

    const groups: Group[] = Array.from(recipientYearMap.entries())
      .map(([recipient, yearMap]) => ({
        recipient,
        rows: Array.from(yearMap.values()).sort((a, b) => a.year - b.year),
      }))
      .sort((a, b) => a.recipient.localeCompare(b.recipient));

    const flatRows: YearRow[] = groups.flatMap((g) => g.rows);
    
    // 행 인덱스 맵 생성 (성능 최적화: O(1) 조회)
    const rowIndexMap = new Map<string, number>();
    flatRows.forEach((row, index) => {
      rowIndexMap.set(`${row.recipient}-${row.year}`, index);
    });
    
    return {
      groups,
      flatRows,
      monthTotalsAmt,
      monthTotalsCnt,
      grandTotalAmt,
      grandTotalCnt,
      rowIndexMap,
    };
  }, [filteredData]);

  // 월별/연도별 표와 동일한 집계 함수
  const calculateStatistic = useMemo(() => {
    // 선택된 셀들에서 데이터 수집
    const counts: number[] = [];
    const amounts: number[] = [];

    selectedCells.forEach((cellId) => {
      const parts = cellId.split("-");
      if (parts.length < 3) return;

      const month = parseInt(parts[parts.length - 1], 10);
      const year = parseInt(parts[parts.length - 2], 10);
      const recipient = parts.slice(0, -2).join("-");

      if (isNaN(year) || isNaN(month)) return;

      // 해당 수취인의 해당 연도/월 데이터 찾기
      const group = groups.find((g) => g.recipient === recipient);
      if (!group) return;

      const yearRow = group.rows.find((r) => r.year === year);
      if (!yearRow) return;

      const monthData = yearRow.months[month];
      if (!monthData) return;

      counts.push(monthData.count);
      if (monthData.amount > 0) amounts.push(monthData.amount);
    });

    if (statisticType === "count") return counts.reduce((s, c) => s + c, 0);
    if (amounts.length === 0) return 0;
    switch (statisticType) {
      case "sum":
        return amounts.reduce((s, v) => s + v, 0);
      case "avg":
        return Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length);
      case "max":
        return Math.max(...amounts);
      case "min":
        return Math.min(...amounts);
      default:
        return 0;
    }
  }, [groups, selectedCells, statisticType]);

  // handleCellMouseEnter 정의 (rowIndexMap, flatRows 접근 가능)
  const handleCellMouseEnter = useCallback((
    recipient: string,
    year: number,
    month: number
  ) => {
    if (!isDragging || !dragStart) return;

    // throttling 적용 (16ms = ~60fps)
    if (throttleRef.current) clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(() => {
      // rowIndexMap을 사용한 O(1) 조회 (성능 최적화)
      const startRowIndex = rowIndexMap.get(`${dragStart.recipient}-${dragStart.year}`) ?? -1;
      const currentRowIndex = rowIndexMap.get(`${recipient}-${year}`) ?? -1;

      if (startRowIndex === -1 || currentRowIndex === -1) return;

      // 행 범위와 월 범위 계산
      const minRowIndex = Math.min(startRowIndex, currentRowIndex);
      const maxRowIndex = Math.max(startRowIndex, currentRowIndex);
      const minMonth = Math.min(dragStart.month, month);
      const maxMonth = Math.max(dragStart.month, month);

      const rectCells: string[] = [];

      // 선택된 행 범위의 모든 셀 추가
      for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
        const row = flatRows[rowIndex];
        for (let m = minMonth; m <= maxMonth; m++) {
          rectCells.push(getCellId(row.recipient, row.year, m));
        }
      }

      let next: Set<string>;
      if (isAdditiveDrag && baseSelectedCells) {
        next = new Set(baseSelectedCells);
        if (additiveMode === "add") {
          for (const c of rectCells) next.add(c);
        } else if (additiveMode === "remove") {
          for (const c of rectCells) next.delete(c);
        } else {
          for (const c of rectCells) next.add(c);
        }
      } else {
        next = new Set(rectCells);
      }

      if (
        recipient !== dragStart.recipient ||
        year !== dragStart.year ||
        month !== dragStart.month
      ) {
        setDidDrag(true);
      }
      setDragCurrent({ recipient, year, month });
      setSelectedCells(next);
    }, 16);
  }, [isDragging, dragStart, isAdditiveDrag, baseSelectedCells, additiveMode, rowIndexMap, flatRows]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xl h-10 flex items-center font-semibold">
          수취인별 송금량
        </h3>
        <div className="flex items-center gap-4">
          {selectedCells.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCells.size}개 셀 선택됨
              </span>
              <Select
                value={statisticType}
                onValueChange={(v: any) => setStatisticType(v)}
              >
                <SelectTrigger className="min-w-[180px] justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground">
                      {
                        (
                          {
                            sum: "합",
                            avg: "평균",
                            max: "최대",
                            min: "최소",
                            count: "건수",
                          } as const
                        )[statisticType]
                      }
                    </span>
                    <span className="text-xs font-medium">
                      {statisticType === "count"
                        ? calculateStatistic
                        : formatAmount(calculateStatistic)}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">합</SelectItem>
                  <SelectItem value="avg">평균</SelectItem>
                  <SelectItem value="max">최대</SelectItem>
                  <SelectItem value="min">최소</SelectItem>
                  <SelectItem value="count">건수</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <div
        className="rounded-md border overflow-hidden"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="overflow-x-auto w-full">
          <Table className="min-w-max whitespace-nowrap [&_tr]:border-b-0 select-none">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center h-12 w-32 border-r border-b border-dashed border-gray-300 bg-muted">
                  수취인
                </TableHead>
                <TableHead className="text-center h-12 w-20 border-r border-b border-dashed border-gray-300 bg-muted">
                  연도
                </TableHead>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <TableHead
                    key={m}
                    className="text-center h-12 w-20 border-r border-b border-dashed border-gray-300 bg-slate-100"
                  >
                    {m}월
                  </TableHead>
                ))}
                <TableHead className="text-center h-12 w-24 border-b border-dashed border-gray-300 bg-slate-100">
                  총계
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const rowsOut: React.ReactElement[] = [];

                groups.forEach((g, groupIndex) => {
                  const isExpanded = expandedRecipients[g.recipient];

                  if (isExpanded) {
                    // 펼침 상태: 모든 연도별 행 표시
                    const span = g.rows.length + 1; // include recipient total row
                    g.rows.forEach((row, localIdx) => {
                      rowsOut.push(
                        <TableRow key={`${g.recipient}__${row.year}`}>
                          {localIdx === 0 && (
                            <TableCell
                              rowSpan={span}
                              className="align-middle text-center w-32 border-r border-dashed border-gray-300 bg-muted"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => toggleRecipient(g.recipient)}
                                  className="flex items-center justify-center w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-sm transition-colors"
                                >
                                  {expandedRecipients[g.recipient] ? (
                                    <svg
                                      className="w-2.5 h-2.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 12H4"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-2.5 h-2.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                  )}
                                </button>
                                <span className="truncate">{g.recipient}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-medium bg-muted text-center w-20 border-r border-b border-dashed border-gray-300">
                            {row.year}
                          </TableCell>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (m) => {
                              const cellId = getCellId(
                                g.recipient,
                                row.year,
                                m
                              );
                              const isSelected = selectedCells.has(cellId);
                              const inDragRect = (() => {
                                if (!isDragging || !dragStart || !dragCurrent)
                                  return false;

                                // rowIndexMap 사용한 O(1) 조회
                                const startRowIndex = rowIndexMap.get(`${dragStart.recipient}-${dragStart.year}`) ?? -1;
                                const currentRowIndex = rowIndexMap.get(`${dragCurrent.recipient}-${dragCurrent.year}`) ?? -1;
                                const thisRowIndex = rowIndexMap.get(`${g.recipient}-${row.year}`) ?? -1;

                                if (startRowIndex === -1 || currentRowIndex === -1 || thisRowIndex === -1)
                                  return false;

                                const minRowIndex = Math.min(startRowIndex, currentRowIndex);
                                const maxRowIndex = Math.max(startRowIndex, currentRowIndex);
                                const minM = Math.min(dragStart.month, dragCurrent.month);
                                const maxM = Math.max(dragStart.month, dragCurrent.month);

                                return (
                                  thisRowIndex >= minRowIndex &&
                                  thisRowIndex <= maxRowIndex &&
                                  m >= minM &&
                                  m <= maxM
                                );
                              })();
                              return (
                                <ContextMenu key={m}>
                                  <ContextMenuTrigger asChild>
                                    <TableCell
                                      className={`relative text-center w-20 border-r border-b border-dashed border-gray-300 cursor-pointer transition-colors hover:bg-gray-100 ${
                                        isSelected
                                          ? "bg-blue-100 hover:bg-blue-200"
                                          : ""
                                      }`}
                                      onClick={(e) =>
                                        handleCellClick(
                                          g.recipient,
                                          row.year,
                                          m,
                                          e
                                        )
                                      }
                                      onMouseDown={(e) =>
                                        handleCellMouseDown(
                                          g.recipient,
                                          row.year,
                                          m,
                                          e
                                        )
                                      }
                                      onMouseEnter={() =>
                                        handleCellMouseEnter(
                                          g.recipient,
                                          row.year,
                                          m
                                        )
                                      }
                                    >
                                      {/* Selection outer border (final selection) */}
                                      {isSelected &&
                                        (!isDragging || !inDragRect) &&
                                        (() => {
                                          // 인접한 선택된 셀들 확인해서 외곽 테두리만 표시
                                          const currentRowIndex = rowIndexMap.get(`${g.recipient}-${row.year}`) ?? -1;
                                          const topRow = currentRowIndex > 0 ? flatRows[currentRowIndex - 1] : null;
                                          const bottomRow = currentRowIndex < flatRows.length - 1 ? flatRows[currentRowIndex + 1] : null;
                                          
                                          const topSel = topRow && topRow.recipient === g.recipient && selectedCells.has(
                                            getCellId(topRow.recipient, topRow.year, m)
                                          );
                                          const bottomSel = bottomRow && bottomRow.recipient === g.recipient && selectedCells.has(
                                            getCellId(bottomRow.recipient, bottomRow.year, m)
                                          );
                                          const leftSel = selectedCells.has(
                                            getCellId(g.recipient, row.year, m - 1)
                                          );
                                          const rightSel = selectedCells.has(
                                            getCellId(g.recipient, row.year, m + 1)
                                          );
                                          return (
                                            <>
                                              {!topSel && (
                                                <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-blue-500" />
                                              )}
                                              {!bottomSel && (
                                                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-blue-500" />
                                              )}
                                              {!leftSel && (
                                                <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-blue-500" />
                                              )}
                                              {!rightSel && (
                                                <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-px bg-blue-500" />
                                              )}
                                            </>
                                          );
                                        })()}
                                      {/* Drag rectangle outer border only */}
                                      {inDragRect &&
                                        isDragging &&
                                        (() => {
                                          const startRowIndex = rowIndexMap.get(`${dragStart!.recipient}-${dragStart!.year}`) ?? -1;
                                          const currentRowIndex = rowIndexMap.get(`${dragCurrent!.recipient}-${dragCurrent!.year}`) ?? -1;
                                          const thisRowIndex = rowIndexMap.get(`${g.recipient}-${row.year}`) ?? -1;

                                          const minRowIndex = Math.min(startRowIndex, currentRowIndex);
                                          const maxRowIndex = Math.max(startRowIndex, currentRowIndex);
                                          const minM = Math.min(dragStart!.month, dragCurrent!.month);
                                          const maxM = Math.max(dragStart!.month, dragCurrent!.month);

                                          const isTopEdge = thisRowIndex === minRowIndex;
                                          const isBottomEdge = thisRowIndex === maxRowIndex;
                                          const isLeftEdge = m === minM;
                                          const isRightEdge = m === maxM;

                                          return (
                                            <>
                                              {isTopEdge && (
                                                <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-blue-300" />
                                              )}
                                              {isBottomEdge && (
                                                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-blue-300" />
                                              )}
                                              {isLeftEdge && (
                                                <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-blue-300" />
                                              )}
                                              {isRightEdge && (
                                                <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-px bg-blue-300" />
                                              )}
                                            </>
                                          );
                                        })()}
                                      {(() => {
                                        const agg = row.months[m] || {
                                          amount: 0,
                                          count: 0,
                                        };
                                        const amt = agg.amount;
                                        const cnt = agg.count;
                                        if (cnt === 0 && amt === 0)
                                          return (
                                            <div className="text-sm text-center text-muted-foreground">
                                              -
                                            </div>
                                          );
                                        return (
                                          <div className="text-xs">
                                            <div className="text-[11px] text-muted-foreground">
                                              {cnt}
                                            </div>
                                            <div>{formatAmount(amt)}</div>
                                          </div>
                                        );
                                      })()}
                                    </TableCell>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem
                                      onClick={copySelectedCellsAmount}
                                      disabled={selectedCells.size === 0}
                                    >
                                      복사
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            }
                          )}
                          <ContextMenu
                            onOpenChange={(open) => {
                              if (open) {
                                setActiveContextCell(
                                  `row-${g.recipient}-${row.year}-total`
                                );
                              } else {
                                setActiveContextCell(null);
                              }
                            }}
                          >
                            <ContextMenuTrigger asChild>
                              <TableCell
                                className={`text-center w-24 border-b border-dashed border-gray-300 cursor-pointer transition-colors ${
                                  activeContextCell ===
                                  `row-${g.recipient}-${row.year}-total`
                                    ? "bg-green-100"
                                    : ""
                                }`}
                              >
                                {(() => {
                                  const cnt = row.rowTotalCnt;
                                  const amt = row.rowTotalAmt;
                                  if (cnt === 0 && amt === 0)
                                    return <span>-</span>;
                                  return (
                                    <div className="text-xs">
                                      <div className="text-[11px] text-muted-foreground">
                                        {cnt}
                                      </div>
                                      <div>{formatAmount(amt)}</div>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => {
                                  if (row.rowTotalAmt > 0) {
                                    const formattedAmount =
                                      row.rowTotalAmt.toLocaleString("ko-KR");
                                    navigator.clipboard
                                      .writeText(formattedAmount)
                                      .catch(() => {
                                        const textArea =
                                          document.createElement("textarea");
                                        textArea.value = formattedAmount;
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(textArea);
                                      });
                                  }
                                }}
                                disabled={row.rowTotalAmt === 0}
                              >
                                복사
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </TableRow>
                      );
                    });

                    // recipient totals row
                    const recTotalsByMonth = Array.from(
                      { length: 12 },
                      (_, i) => i + 1
                    ).map((m) => {
                      const cnt = g.rows.reduce(
                        (s, r) => s + (r.months[m]?.count || 0),
                        0
                      );
                      const amt = g.rows.reduce(
                        (s, r) => s + (r.months[m]?.amount || 0),
                        0
                      );
                      return { m, cnt, amt };
                    });
                    const recTotalCnt = g.rows.reduce(
                      (s, r) => s + r.rowTotalCnt,
                      0
                    );
                    const recTotalAmt = g.rows.reduce(
                      (s, r) => s + r.rowTotalAmt,
                      0
                    );
                    rowsOut.push(
                      <TableRow
                        key={`${g.recipient}__total`}
                        className="bg-muted"
                      >
                        <TableCell className="font-medium text-center w-20 border-r border-dashed border-gray-300 !bg-muted">
                          총계
                        </TableCell>
                        {recTotalsByMonth.map(({ m, cnt, amt }) => (
                          <ContextMenu
                            key={m}
                            onOpenChange={(open) => {
                              if (open) {
                                setActiveContextCell(
                                  `expanded-${g.recipient}-${m}`
                                );
                              } else {
                                setActiveContextCell(null);
                              }
                            }}
                          >
                            <ContextMenuTrigger asChild>
                              <TableCell
                                className={`text-center w-20 border-r border-dashed border-gray-300 cursor-pointer transition-colors bg-slate-200 ${
                                  activeContextCell ===
                                  `expanded-${g.recipient}-${m}`
                                    ? "bg-green-100"
                                    : ""
                                }`}
                              >
                                {cnt === 0 && amt === 0 ? (
                                  <div className="text-sm text-center text-muted-foreground">
                                    -
                                  </div>
                                ) : (
                                  <div className="text-xs">
                                    <div className="text-[11px] text-muted-foreground">
                                      {cnt}
                                    </div>
                                    <div>{formatAmount(amt)}</div>
                                  </div>
                                )}
                              </TableCell>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => {
                                  if (amt > 0) {
                                    const formattedAmount =
                                      amt.toLocaleString("ko-KR");
                                    navigator.clipboard
                                      .writeText(formattedAmount)
                                      .catch(() => {
                                        const textArea =
                                          document.createElement("textarea");
                                        textArea.value = formattedAmount;
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(textArea);
                                      });
                                  }
                                }}
                                disabled={amt === 0}
                              >
                                복사
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                        <ContextMenu
                          onOpenChange={(open) => {
                            if (open) {
                              setActiveContextCell(
                                `expanded-${g.recipient}-total`
                              );
                            } else {
                              setActiveContextCell(null);
                            }
                          }}
                        >
                          <ContextMenuTrigger asChild>
                            <TableCell
                              className={`text-center w-24 cursor-pointer transition-colors bg-slate-200 ${
                                activeContextCell ===
                                `expanded-${g.recipient}-total`
                                  ? "bg-green-100"
                                  : ""
                              }`}
                            >
                              {recTotalCnt === 0 && recTotalAmt === 0 ? (
                                <span>-</span>
                              ) : (
                                <div className="text-xs">
                                  <div className="text-[11px] text-muted-foreground">
                                    {recTotalCnt}
                                  </div>
                                  <div>{formatAmount(recTotalAmt)}</div>
                                </div>
                              )}
                            </TableCell>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => {
                                if (recTotalAmt > 0) {
                                  const formattedAmount =
                                    recTotalAmt.toLocaleString("ko-KR");
                                  navigator.clipboard
                                    .writeText(formattedAmount)
                                    .catch(() => {
                                      const textArea =
                                        document.createElement("textarea");
                                      textArea.value = formattedAmount;
                                      document.body.appendChild(textArea);
                                      textArea.select();
                                      document.execCommand("copy");
                                      document.body.removeChild(textArea);
                                    });
                                }
                              }}
                              disabled={recTotalAmt === 0}
                            >
                              복사
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </TableRow>
                    );
                  } else {
                    // 접힘 상태: 수취인 총계만 표시
                    const recTotalsByMonth = Array.from(
                      { length: 12 },
                      (_, i) => i + 1
                    ).map((m) => {
                      const cnt = g.rows.reduce(
                        (s, r) => s + (r.months[m]?.count || 0),
                        0
                      );
                      const amt = g.rows.reduce(
                        (s, r) => s + (r.months[m]?.amount || 0),
                        0
                      );
                      return { m, cnt, amt };
                    });
                    const recTotalCnt = g.rows.reduce(
                      (s, r) => s + r.rowTotalCnt,
                      0
                    );
                    const recTotalAmt = g.rows.reduce(
                      (s, r) => s + r.rowTotalAmt,
                      0
                    );

                    rowsOut.push(
                      <TableRow
                        key={`${g.recipient}__collapsed`}
                        className="bg-muted"
                      >
                        <TableCell className="text-center w-32 border-r border-b border-dashed border-gray-300 bg-muted">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleRecipient(g.recipient)}
                              className="flex items-center justify-center w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-sm transition-colors"
                            >
                              {expandedRecipients[g.recipient] ? (
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 12H4"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              )}
                            </button>
                            <span className="truncate">{g.recipient}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-center w-20 border-r border-dashed border-gray-300 !bg-muted">
                          총계
                        </TableCell>
                        {recTotalsByMonth.map(({ m, cnt, amt }) => (
                          <ContextMenu key={m}>
                            <ContextMenuTrigger asChild>
                              <TableCell className="text-center w-20 border-r border-dashed border-gray-300 cursor-pointer transition-colors bg-slate-200">
                                {cnt === 0 && amt === 0 ? (
                                  <div className="text-sm text-center text-muted-foreground">
                                    -
                                  </div>
                                ) : (
                                  <div className="text-xs">
                                    <div className="text-[11px] text-muted-foreground">
                                      {cnt}
                                    </div>
                                    <div>{formatAmount(amt)}</div>
                                  </div>
                                )}
                              </TableCell>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => {
                                  if (amt > 0) {
                                    const formattedAmount =
                                      amt.toLocaleString("ko-KR");
                                    navigator.clipboard
                                      .writeText(formattedAmount)
                                      .catch(() => {
                                        const textArea =
                                          document.createElement("textarea");
                                        textArea.value = formattedAmount;
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(textArea);
                                      });
                                  }
                                }}
                                disabled={amt === 0}
                              >
                                복사
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <TableCell className="text-center w-24 cursor-pointer transition-colors bg-slate-200">
                              {recTotalCnt === 0 && recTotalAmt === 0 ? (
                                <span>-</span>
                              ) : (
                                <div className="text-xs">
                                  <div className="text-[11px] text-muted-foreground">
                                    {recTotalCnt}
                                  </div>
                                  <div>{formatAmount(recTotalAmt)}</div>
                                </div>
                              )}
                            </TableCell>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => {
                                if (recTotalAmt > 0) {
                                  const formattedAmount =
                                    recTotalAmt.toLocaleString("ko-KR");
                                  navigator.clipboard
                                    .writeText(formattedAmount)
                                    .catch(() => {
                                      const textArea =
                                        document.createElement("textarea");
                                      textArea.value = formattedAmount;
                                      document.body.appendChild(textArea);
                                      textArea.select();
                                      document.execCommand("copy");
                                      document.body.removeChild(textArea);
                                    });
                                }
                              }}
                              disabled={recTotalAmt === 0}
                            >
                              복사
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </TableRow>
                    );
                  }

                  // 그룹 구분 점선 (수취인 간) - 마지막 그룹이 아닌 경우만
                  if (groupIndex < groups.length - 1) {
                    rowsOut.push(
                      <TableRow key={`sep-${g.recipient}`}>
                        <TableCell colSpan={15} className="p-0">
                          <div className="h-px bg-gray-300" />
                        </TableCell>
                      </TableRow>
                    );
                  }
                });
                return rowsOut;
              })()}
              {/* 총계 행 */}
              <TableRow
                className="bg-slate-100 hover:bg-slate-100"
                style={{ borderTop: "2px solid #9CA3AF" }}
              >
                <TableCell
                  colSpan={2}
                  className="font-bold text-center border-r border-dashed border-gray-300 bg-muted"
                >
                  전체 총계
                </TableCell>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <ContextMenu
                    key={m}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveContextCell(`grand-total-${m}`);
                      } else {
                        setActiveContextCell(null);
                      }
                    }}
                  >
                    <ContextMenuTrigger asChild>
                      <TableCell
                        className={`text-center w-20 border-r border-dashed border-gray-300 cursor-pointer transition-colors ${
                          activeContextCell === `grand-total-${m}`
                            ? "bg-green-100"
                            : ""
                        }`}
                      >
                        {(() => {
                          const cnt = monthTotalsCnt[m] || 0;
                          const amt = monthTotalsAmt[m] || 0;
                          if (cnt === 0 && amt === 0) return <span>-</span>;
                          return (
                            <div className="text-xs">
                              <div className="text-[11px] text-muted-foreground">
                                {cnt}
                              </div>
                              <div>{formatAmount(amt)}</div>
                            </div>
                          );
                        })()}
                      </TableCell>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          const amt = monthTotalsAmt[m] || 0;
                          if (amt > 0) {
                            const formattedAmount = amt.toLocaleString("ko-KR");
                            navigator.clipboard
                              .writeText(formattedAmount)
                              .catch(() => {
                                const textArea =
                                  document.createElement("textarea");
                                textArea.value = formattedAmount;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                              });
                          }
                        }}
                        disabled={(monthTotalsAmt[m] || 0) === 0}
                      >
                        복사
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                <ContextMenu
                  onOpenChange={(open) => {
                    if (open) {
                      setActiveContextCell("grand-total-total");
                    } else {
                      setActiveContextCell(null);
                    }
                  }}
                >
                  <ContextMenuTrigger asChild>
                    <TableCell
                      className={`text-center w-24 cursor-pointer transition-colors ${
                        activeContextCell === "grand-total-total"
                          ? "bg-green-100"
                          : ""
                      }`}
                    >
                      {(() => {
                        const cnt = grandTotalCnt;
                        const amt = grandTotalAmt;
                        if (cnt === 0 && amt === 0) return <span>-</span>;
                        return (
                          <div className="text-xs">
                            <div className="text-[11px] text-muted-foreground">
                              {cnt}
                            </div>
                            <div>{formatAmount(amt)}</div>
                          </div>
                        );
                      })()}
                    </TableCell>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => {
                        if (grandTotalAmt > 0) {
                          const formattedAmount =
                            grandTotalAmt.toLocaleString("ko-KR");
                          navigator.clipboard
                            .writeText(formattedAmount)
                            .catch(() => {
                              const textArea =
                                document.createElement("textarea");
                              textArea.value = formattedAmount;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand("copy");
                              document.body.removeChild(textArea);
                            });
                        }
                      }}
                      disabled={grandTotalAmt === 0}
                    >
                      복사
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
