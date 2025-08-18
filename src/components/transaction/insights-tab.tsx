"use client";

import React, { useMemo, useState } from "react";
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
import {
  getCellId,
  formatDateForCalendar,
  formatDateTime,
  formatAmount,
} from "./transaction-utils";
import { getCurrencyBySendingCountry } from "./transaction-utils";
import { RecipientPivot } from "./recipient-pivot";

type StatisticType = "sum" | "avg" | "max" | "min" | "count";

interface InsightsTabProps {
  filteredData: any[];
}

export function InsightsTab({ filteredData }: InsightsTabProps) {
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
  const [statisticType, setStatisticType] = useState<StatisticType>("sum");
  const [activeContextCell, setActiveContextCell] = useState<string | null>(null);

  // 선택된 셀들의 합계 복사 함수
  const copySelectedCellsAmount = async () => {
    const completed = filteredData.filter((t: any) => t.status === "지급완료");
    const yearsList = completed
      .map((t: any) => {
        const d = new Date(t.finished);
        return isNaN(d.getTime()) ? null : d.getFullYear();
      })
      .filter((y: number | null): y is number => y !== null);
    const years: number[] = Array.from(new Set<number>(yearsList)).sort(
      (a, b) => a - b
    );
    const pivot: Record<
      number,
      Record<number, { count: number; amount: number }>
    > = {};
    for (const y of years) {
      pivot[y] = {} as Record<number, { count: number; amount: number }>;
      for (let m = 1; m <= 12; m++) pivot[y][m] = { count: 0, amount: 0 };
    }
    completed.forEach((t: any) => {
      const d = new Date(t.finished);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const a = Number(t.localSourceAmt ?? t.sourceAmt) || 0;
      if (pivot[y] && pivot[y][m]) {
        pivot[y][m].count += 1;
        pivot[y][m].amount += a;
      }
    });

    const amounts: number[] = [];
    selectedCells.forEach((id) => {
      const [ys, ms] = id.split("-");
      const y = parseInt(ys);
      const m = parseInt(ms);
      if (pivot[y] && pivot[y][m]) {
        const { amount } = pivot[y][m];
        if (amount > 0) amounts.push(amount);
      }
    });

    const totalAmount = amounts.reduce((s, v) => s + v, 0);
    const formattedAmount = totalAmount.toLocaleString("ko-KR");
    
    try {
      await navigator.clipboard.writeText(formattedAmount);
    } catch (err) {
      // fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = formattedAmount;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCellClick = (
    year: number,
    month: number,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    if (didDrag) {
      setDidDrag(false);
      return;
    }
    const cellId = getCellId(year, month);
    const next = new Set(selectedCells);
    if (event.ctrlKey || event.metaKey) {
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
    } else {
      next.clear();
      next.add(cellId);
    }
    setSelectedCells(next);
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
      const startCellId = getCellId(year, month);
      setBaseSelectedCells(new Set(selectedCells));
      setAdditiveMode(selectedCells.has(startCellId) ? "remove" : "add");
    } else {
      setBaseSelectedCells(null);
      const only = new Set<string>();
      only.add(getCellId(year, month));
      setSelectedCells(only);
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
    if (year !== dragStart.year || month !== dragStart.month) setDidDrag(true);
    setDragCurrent({ year, month });
    setSelectedCells(next);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsAdditiveDrag(false);
    setDragStart(null);
    setBaseSelectedCells(null);
    setAdditiveMode("none");
    setDragCurrent(null);
  };

  const calculateStatistic = useMemo(() => {
    const completed = filteredData.filter((t: any) => t.status === "지급완료");
    const yearsList = completed
      .map((t: any) => {
        const d = new Date(t.finished);
        return isNaN(d.getTime()) ? null : d.getFullYear();
      })
      .filter((y: number | null): y is number => y !== null);
    const years: number[] = Array.from(new Set<number>(yearsList)).sort(
      (a, b) => a - b
    );
    const pivot: Record<
      number,
      Record<number, { count: number; amount: number }>
    > = {};
    for (const y of years) {
      pivot[y] = {} as Record<number, { count: number; amount: number }>;
      for (let m = 1; m <= 12; m++) pivot[y][m] = { count: 0, amount: 0 };
    }
    completed.forEach((t: any) => {
      const d = new Date(t.finished);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const a = Number(t.localSourceAmt ?? t.sourceAmt) || 0;
      if (pivot[y] && pivot[y][m]) {
        pivot[y][m].count += 1;
        pivot[y][m].amount += a;
      }
    });
    const counts: number[] = [];
    const amounts: number[] = [];
    selectedCells.forEach((id) => {
      const [ys, ms] = id.split("-");
      const y = parseInt(ys);
      const m = parseInt(ms);
      if (pivot[y] && pivot[y][m]) {
        const { count, amount } = pivot[y][m];
        counts.push(count);
        if (amount > 0) amounts.push(amount);
      }
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
  }, [filteredData, selectedCells, statisticType]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl h-10 flex items-center font-semibold">
          월별/연도별 로컬송금 분석
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
        className="rounded-md border"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="overflow-x-auto w-full">
          <Table className="min-w-max whitespace-nowrap [&_tr]:border-b-0 select-none">
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
                  return monthNames.map((name, idx) => (
                    <TableHead
                      key={idx}
                      className="text-center h-12 w-20 border-r border-dashed border-gray-300 bg-slate-50"
                    >
                      {name}
                    </TableHead>
                  ));
                })()}
                <TableHead className="text-center h-12 w-24 bg-slate-50">
                  <div className="space-y-1">
                    <div>총계</div>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const completed = filteredData.filter(
                  (t: any) => t.status === "지급완료"
                );
                const yearsList = completed
                  .map((t: any) => {
                    const d = new Date(t.finished);
                    return isNaN(d.getTime()) ? null : d.getFullYear();
                  })
                  .filter((y: number | null): y is number => y !== null);
                const years: number[] = Array.from(
                  new Set<number>(yearsList)
                ).sort((a, b) => a - b);
                const pivot: Record<
                  number,
                  Record<number, { count: number; amount: number }>
                > = {};
                for (const y of years) {
                  pivot[y] = {};
                  for (let m = 1; m <= 12; m++)
                    pivot[y][m] = { count: 0, amount: 0 };
                }
                completed.forEach((t: any) => {
                  const d = new Date(t.finished);
                  if (isNaN(d.getTime())) return;
                  const y = d.getFullYear();
                  const m = d.getMonth() + 1;
                  const a = Number(t.localSourceAmt ?? t.sourceAmt) || 0;
                  if (pivot[y] && pivot[y][m]) {
                    pivot[y][m].count += 1;
                    pivot[y][m].amount += a;
                  }
                });
                return years.map((y: number) => {
                  const yearData = pivot[y];
                  const yearTotal = Array.from(
                    { length: 12 },
                    (_, i) => i + 1
                  ).reduce(
                    (tot, m) => ({
                      count: tot.count + (yearData[m]?.count || 0),
                      amount: tot.amount + (yearData[m]?.amount || 0),
                    }),
                    { count: 0, amount: 0 }
                  );
                  return (
                    <TableRow key={y.toString()}>
                      <TableCell className="font-medium bg-muted text-center w-20 border-r border-dashed border-gray-300">
                        {y}년
                      </TableCell>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const cellId = getCellId(y as number, m);
                        const isSelected = selectedCells.has(cellId);
                        const inDragRect = (() => {
                          if (!isDragging || !dragStart || !dragCurrent)
                            return false;
                          const minY = Math.min(
                            dragStart.year,
                            dragCurrent.year
                          );
                          const maxY = Math.max(
                            dragStart.year,
                            dragCurrent.year
                          );
                          const minM = Math.min(
                            dragStart.month,
                            dragCurrent.month
                          );
                          const maxM = Math.max(
                            dragStart.month,
                            dragCurrent.month
                          );
                          return (
                            y >= minY && y <= maxY && m >= minM && m <= maxM
                          );
                        })();
                        return (
                          <ContextMenu key={m}>
                            <ContextMenuTrigger asChild>
                              <TableCell
                                className={`relative text-center w-20 border-r border-dashed border-gray-300 cursor-pointer transition-colors hover:bg-gray-100 ${
                                  isSelected ? "bg-blue-100 hover:bg-blue-200" : ""
                                }`}
                                onClick={(e) => handleCellClick(y as number, m, e)}
                                onMouseDown={(e) =>
                                  handleCellMouseDown(y as number, m, e)
                                }
                                onMouseEnter={() =>
                                  handleCellMouseEnter(y as number, m)
                                }
                              >
                            {/* Selection outer border (final selection) */}
                            {isSelected &&
                              (!isDragging || !inDragRect) &&
                              (() => {
                                const topSel = selectedCells.has(
                                  getCellId((y as number) - 1, m)
                                );
                                const bottomSel = selectedCells.has(
                                  getCellId((y as number) + 1, m)
                                );
                                const leftSel = selectedCells.has(
                                  getCellId(y as number, m - 1)
                                );
                                const rightSel = selectedCells.has(
                                  getCellId(y as number, m + 1)
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
                                const minY = Math.min(
                                  dragStart!.year,
                                  dragCurrent!.year
                                );
                                const maxY = Math.max(
                                  dragStart!.year,
                                  dragCurrent!.year
                                );
                                const minM = Math.min(
                                  dragStart!.month,
                                  dragCurrent!.month
                                );
                                const maxM = Math.max(
                                  dragStart!.month,
                                  dragCurrent!.month
                                );
                                const isTopEdge = y === minY;
                                const isBottomEdge = y === maxY;
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
                              const count = yearData[m]?.count || 0;
                              const amount = yearData[m]?.amount || 0;
                              if (count === 0 && amount === 0) {
                                return (
                                  <div className="text-sm text-center text-muted-foreground">
                                    -
                                  </div>
                                );
                              }
                              return (
                                <div className="text-xs">
                                  <div className="text-[11px] text-muted-foreground">
                                    {count}
                                  </div>
                                  <div>{formatAmount(amount)}</div>
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
                      })}
                      <ContextMenu
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveContextCell(`year-${y}-total`);
                          } else {
                            setActiveContextCell(null);
                          }
                        }}
                      >
                        <ContextMenuTrigger asChild>
                          <TableCell 
                            className={`text-center w-24 cursor-pointer transition-colors ${
                              activeContextCell === `year-${y}-total` ? "bg-green-100" : ""
                            }`}
                          >
                            {yearTotal.count === 0 && yearTotal.amount === 0 ? (
                              <div className="text-sm text-center text-muted-foreground">
                                -
                              </div>
                            ) : (
                              <div className="text-xs">
                                <div className="text-[11px] text-muted-foreground">
                                  {yearTotal.count}
                                </div>
                                <div>{formatAmount(yearTotal.amount)}</div>
                              </div>
                            )}
                          </TableCell>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => {
                              if (yearTotal.amount > 0) {
                                const formattedAmount = yearTotal.amount.toLocaleString("ko-KR");
                                navigator.clipboard.writeText(formattedAmount).catch(() => {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = formattedAmount;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(textArea);
                                });
                              }
                            }}
                            disabled={yearTotal.amount === 0}
                          >
                            복사
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </TableRow>
                  );
                });
              })()}
              <TableRow className="bg-muted">
                <TableCell className="font-bold text-center w-20 border-r border-dashed border-gray-300">
                  총계
                </TableCell>
                {(() => {
                  const completed = filteredData.filter(
                    (t: any) => t.status === "지급완료"
                  );
                  const monthTotals = Array.from(
                    { length: 12 },
                    (_, i) => i + 1
                  ).map((m) => {
                    const monthTx = completed.filter((t: any) => {
                      const d = new Date(t.finished);
                      return !isNaN(d.getTime()) && d.getMonth() + 1 === m;
                    });
                    return {
                      month: m,
                      count: monthTx.length,
                      amount: monthTx.reduce(
                        (s: number, t: any) =>
                          s + (Number(t.localSourceAmt ?? t.sourceAmt) || 0),
                        0
                      ),
                    };
                  });
                  const grand = {
                    count: completed.length,
                    amount: completed.reduce(
                      (s: number, t: any) =>
                        s + (Number(t.localSourceAmt ?? t.sourceAmt) || 0),
                      0
                    ),
                  };
                  return (
                    <>
                      {monthTotals.map((mt) => (
                        <ContextMenu 
                          key={mt.month}
                          onOpenChange={(open) => {
                            if (open) {
                              setActiveContextCell(`month-${mt.month}`);
                            } else {
                              setActiveContextCell(null);
                            }
                          }}
                        >
                          <ContextMenuTrigger asChild>
                            <TableCell
                              className={`text-center w-20 border-r border-dashed border-gray-300 cursor-pointer transition-colors ${
                                activeContextCell === `month-${mt.month}` ? "bg-green-100" : ""
                              }`}
                            >
                              {mt.count === 0 && mt.amount === 0 ? (
                                <div className="text-sm text-center text-muted-foreground">
                                  -
                                </div>
                              ) : (
                                <div className="text-xs">
                                  <div className="text-[11px] text-muted-foreground font-normal">
                                    {mt.count > 0 ? mt.count : "-"}
                                  </div>
                                  <div>
                                    {mt.amount > 0 ? formatAmount(mt.amount) : "-"}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => {
                                if (mt.amount > 0) {
                                  const formattedAmount = mt.amount.toLocaleString("ko-KR");
                                  navigator.clipboard.writeText(formattedAmount).catch(() => {
                                    const textArea = document.createElement("textarea");
                                    textArea.value = formattedAmount;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    document.execCommand("copy");
                                    document.body.removeChild(textArea);
                                  });
                                }
                              }}
                              disabled={mt.amount === 0}
                            >
                              복사
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                      <ContextMenu
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveContextCell("grand-total");
                          } else {
                            setActiveContextCell(null);
                          }
                        }}
                      >
                        <ContextMenuTrigger asChild>
                          <TableCell 
                            className={`text-center w-24 cursor-pointer transition-colors ${
                              activeContextCell === "grand-total" ? "bg-green-100" : ""
                            }`}
                          >
                            {grand.count === 0 && grand.amount === 0 ? (
                              <div className="text-sm text-center text-muted-foreground">
                                -
                              </div>
                            ) : (
                              <div className="text-xs">
                                <div className="text-[11px] text-muted-foreground font-normal">
                                  {grand.count}
                                </div>
                                <div>{formatAmount(grand.amount)}</div>
                              </div>
                            )}
                          </TableCell>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => {
                              if (grand.amount > 0) {
                                const formattedAmount = grand.amount.toLocaleString("ko-KR");
                                navigator.clipboard.writeText(formattedAmount).catch(() => {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = formattedAmount;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(textArea);
                                });
                              }
                            }}
                            disabled={grand.amount === 0}
                          >
                            복사
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </>
                  );
                })()}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      {/* 수취인별 송금량 표 */}
      <RecipientPivot filteredData={filteredData} />
    </div>
  );
}
