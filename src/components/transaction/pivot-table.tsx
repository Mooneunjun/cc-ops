"use client";

import React, { useMemo, useState, ReactNode } from "react";
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

interface CellData {
  count: number;
  amount: number;
}

interface PivotTableProps {
  title: string;
  data: Record<string, CellData>;
  getCellId: (row: string, col: string) => string;
  headers: string[];
  rows: string[];
  onCellClick?: (row: string, col: string, event: React.MouseEvent) => void;
  renderCell?: (cellId: string, data: CellData) => ReactNode;
  rowTotals?: Record<string, CellData>;
  colTotals?: Record<string, CellData>;
  grandTotal?: CellData;
}

export function PivotTable({
  title,
  data,
  getCellId,
  headers,
  rows,
  onCellClick,
  renderCell,
  rowTotals,
  colTotals,
  grandTotal,
}: PivotTableProps) {
  // 로컬 상태로 변경
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    row: string;
    col: string;
  } | null>(null);
  const [baseSelectedCells, setBaseSelectedCells] =
    useState<Set<string> | null>(null);
  const [isAdditiveDrag, setIsAdditiveDrag] = useState(false);
  const [didDrag, setDidDrag] = useState(false);
  const [additiveMode, setAdditiveMode] = useState<"none" | "add" | "remove">(
    "none"
  );
  const [dragCurrent, setDragCurrent] = useState<{
    row: string;
    col: string;
  } | null>(null);
  const [statisticType, setStatisticType] = useState<StatisticType>("sum");
  const [activeContextCell, setActiveContextCell] = useState<string | null>(null);

  const copySelectedCellsAmount = async () => {
    const amounts: number[] = [];
    selectedCells.forEach((cellId) => {
      const cellData = data[cellId];
      if (cellData && cellData.amount > 0) {
        amounts.push(cellData.amount);
      }
    });

    const totalAmount = amounts.reduce((s, v) => s + v, 0);
    const formattedAmount = totalAmount.toLocaleString("ko-KR");

    try {
      await navigator.clipboard.writeText(formattedAmount);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = formattedAmount;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCellClick = (
    row: string,
    col: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    if (didDrag) {
      setDidDrag(false);
      return;
    }
    const cellId = getCellId(row, col);
    const next = new Set(selectedCells);
    if (event.ctrlKey || event.metaKey) {
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
    } else {
      next.clear();
      next.add(cellId);
    }
    setSelectedCells(next);
    onCellClick?.(row, col, event);
  };

  const handleCellMouseDown = (
    row: string,
    col: string,
    event: React.MouseEvent
  ) => {
    const additive = event.ctrlKey || event.metaKey;
    setIsDragging(true);
    setIsAdditiveDrag(additive);
    setDragStart({ row, col });
    setDidDrag(false);
    if (additive) {
      const startCellId = getCellId(row, col);
      setBaseSelectedCells(new Set(selectedCells));
      setAdditiveMode(selectedCells.has(startCellId) ? "remove" : "add");
    } else {
      setBaseSelectedCells(null);
      const only = new Set<string>();
      only.add(getCellId(row, col));
      setSelectedCells(only);
      setAdditiveMode("none");
    }
  };

  const handleCellMouseEnter = (row: string, col: string) => {
    if (!isDragging || !dragStart) return;

    const startRowIndex = rows.indexOf(dragStart.row);
    const currentRowIndex = rows.indexOf(row);
    const startColIndex = headers.indexOf(dragStart.col);
    const currentColIndex = headers.indexOf(col);

    if (
      startRowIndex === -1 ||
      currentRowIndex === -1 ||
      startColIndex === -1 ||
      currentColIndex === -1
    )
      return;

    const minRowIndex = Math.min(startRowIndex, currentRowIndex);
    const maxRowIndex = Math.max(startRowIndex, currentRowIndex);
    const minColIndex = Math.min(startColIndex, currentColIndex);
    const maxColIndex = Math.max(startColIndex, currentColIndex);

    const rectCells: string[] = [];
    for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
      for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
        rectCells.push(getCellId(rows[rowIndex], headers[colIndex]));
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

    if (row !== dragStart.row || col !== dragStart.col) {
      setDidDrag(true);
    }
    setDragCurrent({ row, col });
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
    const counts: number[] = [];
    const amounts: number[] = [];

    selectedCells.forEach((cellId) => {
      const cellData = data[cellId];
      if (cellData) {
        counts.push(cellData.count);
        if (cellData.amount > 0) amounts.push(cellData.amount);
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
  }, [data, selectedCells, statisticType]);

  const renderDefaultCell = (_cellId: string, cellData: CellData) => {
    if (cellData.count === 0 && cellData.amount === 0) {
      return <div className="text-sm text-center text-muted-foreground">-</div>;
    }
    return (
      <div className="text-xs">
        <div className="text-[11px] text-muted-foreground">
          {cellData.count}
        </div>
        <div>{formatAmount(cellData.amount)}</div>
      </div>
    );
  };

  const copyAmount = async (amount: number) => {
    if (amount > 0) {
      const formattedAmount = amount.toLocaleString("ko-KR");
      try {
        await navigator.clipboard.writeText(formattedAmount);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = formattedAmount;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xl h-10 flex items-center font-semibold">
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {selectedCells.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCells.size}개 셀 선택됨
              </span>
              <Select
                value={statisticType}
                onValueChange={(v: StatisticType) => setStatisticType(v)}
              >
                <SelectTrigger className="min-w-[180px] justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground">
                      {
                        {
                          sum: "합",
                          avg: "평균",
                          max: "최대",
                          min: "최소",
                          count: "건수",
                        }[statisticType]
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
                <ContextMenu
                  onOpenChange={(open) => {
                    if (open) {
                      setActiveContextCell("amount-count-header");
                    } else {
                      setActiveContextCell(null);
                    }
                  }}
                >
                  <ContextMenuTrigger asChild>
                    <TableHead className={`text-center h-12 w-20 border-r border-b border-dashed border-gray-300 bg-muted cursor-pointer transition-colors ${
                      activeContextCell === "amount-count-header" ? "bg-green-100" : ""
                    }`}>
                      <div className="text-s ">금액 / 건수</div>
                    </TableHead>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => copyText("금액 / 건수")}
                    >
                      복사
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                {headers.map((header, idx) => (
                  <ContextMenu
                    key={idx}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveContextCell(`header-${idx}`);
                      } else {
                        setActiveContextCell(null);
                      }
                    }}
                  >
                    <ContextMenuTrigger asChild>
                      <TableHead
                        className={`text-center h-12 w-20 border-r border-b border-dashed border-gray-300 bg-slate-100 cursor-pointer transition-colors ${
                          activeContextCell === `header-${idx}` ? "bg-green-100" : ""
                        }`}
                      >
                        {header}
                      </TableHead>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => copyText(header)}
                      >
                        복사
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                {rowTotals && (
                  <ContextMenu
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveContextCell("total-header");
                      } else {
                        setActiveContextCell(null);
                      }
                    }}
                  >
                    <ContextMenuTrigger asChild>
                      <TableHead className={`text-center h-12 w-24 border-b border-dashed border-gray-300 bg-slate-100 cursor-pointer transition-colors ${
                        activeContextCell === "total-header" ? "bg-green-100" : ""
                      }`}>
                        총계
                      </TableHead>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => copyText("총계")}
                      >
                        복사
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row}>
                  <ContextMenu
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveContextCell(`row-${row}`);
                      } else {
                        setActiveContextCell(null);
                      }
                    }}
                  >
                    <ContextMenuTrigger asChild>
                      <TableCell className={`font-medium bg-muted text-center w-20 border-r border-b border-dashed border-gray-300 cursor-pointer transition-colors ${
                        activeContextCell === `row-${row}` ? "bg-green-100" : ""
                      }`}>
                        {row}
                      </TableCell>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => copyText(row)}
                      >
                        복사
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  {headers.map((col) => {
                    const cellId = getCellId(row, col);
                    const cellData = data[cellId] || { count: 0, amount: 0 };
                    const isSelected = selectedCells.has(cellId);
                    const inDragRect = (() => {
                      if (!isDragging || !dragStart || !dragCurrent)
                        return false;

                      const startRowIndex = rows.indexOf(dragStart.row);
                      const currentRowIndex = rows.indexOf(dragCurrent.row);
                      const startColIndex = headers.indexOf(dragStart.col);
                      const currentColIndex = headers.indexOf(dragCurrent.col);
                      const thisRowIndex = rows.indexOf(row);
                      const thisColIndex = headers.indexOf(col);

                      const minRowIndex = Math.min(
                        startRowIndex,
                        currentRowIndex
                      );
                      const maxRowIndex = Math.max(
                        startRowIndex,
                        currentRowIndex
                      );
                      const minColIndex = Math.min(
                        startColIndex,
                        currentColIndex
                      );
                      const maxColIndex = Math.max(
                        startColIndex,
                        currentColIndex
                      );

                      return (
                        thisRowIndex >= minRowIndex &&
                        thisRowIndex <= maxRowIndex &&
                        thisColIndex >= minColIndex &&
                        thisColIndex <= maxColIndex
                      );
                    })();

                    return (
                      <ContextMenu key={col}>
                        <ContextMenuTrigger asChild>
                          <TableCell
                            className={`relative text-center w-20 border-r border-b border-dashed border-gray-300 cursor-pointer transition-colors hover:bg-gray-100 ${
                              isSelected ? "bg-blue-100 hover:bg-blue-200" : ""
                            }`}
                            onClick={(e) => handleCellClick(row, col, e)}
                            onMouseDown={(e) =>
                              handleCellMouseDown(row, col, e)
                            }
                            onMouseEnter={() => handleCellMouseEnter(row, col)}
                          >
                            {renderCell
                              ? renderCell(cellId, cellData)
                              : renderDefaultCell(cellId, cellData)}

                            {/* Selection outer border (final selection) */}
                            {isSelected &&
                              (!isDragging || !inDragRect) &&
                              (() => {
                                const rowIndex = rows.indexOf(row);
                                const colIndex = headers.indexOf(col);

                                const topSel = selectedCells.has(
                                  getCellId(rows[rowIndex - 1] || "", col)
                                );
                                const bottomSel = selectedCells.has(
                                  getCellId(rows[rowIndex + 1] || "", col)
                                );
                                const leftSel = selectedCells.has(
                                  getCellId(row, headers[colIndex - 1] || "")
                                );
                                const rightSel = selectedCells.has(
                                  getCellId(row, headers[colIndex + 1] || "")
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

                            {/* Drag rectangle border */}
                            {isDragging &&
                              dragStart &&
                              dragCurrent &&
                              inDragRect &&
                              (() => {
                                const startRowIndex = rows.indexOf(
                                  dragStart.row
                                );
                                const currentRowIndex = rows.indexOf(
                                  dragCurrent.row
                                );
                                const startColIndex = headers.indexOf(
                                  dragStart.col
                                );
                                const currentColIndex = headers.indexOf(
                                  dragCurrent.col
                                );
                                const thisRowIndex = rows.indexOf(row);
                                const thisColIndex = headers.indexOf(col);

                                const minRowIndex = Math.min(
                                  startRowIndex,
                                  currentRowIndex
                                );
                                const maxRowIndex = Math.max(
                                  startRowIndex,
                                  currentRowIndex
                                );
                                const minColIndex = Math.min(
                                  startColIndex,
                                  currentColIndex
                                );
                                const maxColIndex = Math.max(
                                  startColIndex,
                                  currentColIndex
                                );

                                const isTopEdge = thisRowIndex === minRowIndex;
                                const isBottomEdge =
                                  thisRowIndex === maxRowIndex;
                                const isLeftEdge = thisColIndex === minColIndex;
                                const isRightEdge =
                                  thisColIndex === maxColIndex;

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
                  {rowTotals && rowTotals[row] && (
                    <ContextMenu
                      onOpenChange={(open) => {
                        if (open) {
                          setActiveContextCell(`${row}-total`);
                        } else {
                          setActiveContextCell(null);
                        }
                      }}
                    >
                      <ContextMenuTrigger asChild>
                        <TableCell className={`text-center w-24 border-b border-dashed border-gray-300 cursor-pointer transition-colors ${
                          activeContextCell === `${row}-total` ? "bg-green-100" : ""
                        }`}>
                          {renderCell
                            ? renderCell(`${row}-total`, rowTotals[row])
                            : renderDefaultCell(`${row}-total`, rowTotals[row])}
                        </TableCell>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => copyAmount(rowTotals[row].amount)}
                          disabled={rowTotals[row].amount === 0}
                        >
                          복사
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )}
                </TableRow>
              ))}
              {colTotals && (
                <TableRow className="bg-slate-100">
                  <ContextMenu
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveContextCell("total-label");
                      } else {
                        setActiveContextCell(null);
                      }
                    }}
                  >
                    <ContextMenuTrigger asChild>
                      <TableCell className={`font-bold text-center border-r border-dashed border-gray-300 bg-muted cursor-pointer transition-colors ${
                        activeContextCell === "total-label" ? "bg-green-100" : ""
                      }`}>
                        총계
                      </TableCell>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => copyText("총계")}
                      >
                        복사
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  {headers.map((col) => {
                    const cellData = colTotals[col] || { count: 0, amount: 0 };
                    return (
                      <ContextMenu 
                        key={col}
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveContextCell(`total-${col}`);
                          } else {
                            setActiveContextCell(null);
                          }
                        }}
                      >
                        <ContextMenuTrigger asChild>
                          <TableCell className={`text-center w-20 border-r border-dashed border-gray-300 cursor-pointer transition-colors bg-slate-100 ${
                            activeContextCell === `total-${col}` ? "bg-green-100" : ""
                          }`}>
                            {renderCell
                              ? renderCell(`total-${col}`, cellData)
                              : renderDefaultCell(`total-${col}`, cellData)}
                          </TableCell>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => copyAmount(cellData.amount)}
                            disabled={cellData.amount === 0}
                          >
                            복사
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                  {grandTotal && (
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
                        <TableCell className={`text-center w-24 cursor-pointer transition-colors bg-slate-100 ${
                          activeContextCell === "grand-total" ? "bg-green-100" : ""
                        }`}>
                          {renderCell
                            ? renderCell("grand-total", grandTotal)
                            : renderDefaultCell("grand-total", grandTotal)}
                        </TableCell>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => copyAmount(grandTotal.amount)}
                          disabled={grandTotal.amount === 0}
                        >
                          복사
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
