"use client";

import React, { useMemo } from "react";
import { PivotTable } from "./pivot-table";
import { getCellId } from "./transaction-utils";

interface MonthlyYearlyPivotProps {
  filteredData: any[];
}

export function MonthlyYearlyPivot({ filteredData }: MonthlyYearlyPivotProps) {
  const { data, rows, headers, rowTotals, colTotals, grandTotal } =
    useMemo(() => {
      const completed = filteredData.filter(
        (t: any) => t.status === "지급완료"
      );

      const yearsList = completed
        .map((t: any) => {
          const d = new Date(t.finished);
          return isNaN(d.getTime()) ? null : d.getFullYear();
        })
        .filter((y: number | null): y is number => y !== null);

      const years: number[] = Array.from(new Set<number>(yearsList)).sort(
        (a, b) => a - b
      );
      const months = [
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

      // 데이터 구조 초기화
      const pivot: Record<string, { count: number; amount: number }> = {};
      const yearTotals: Record<string, { count: number; amount: number }> = {};
      const monthTotals: Record<string, { count: number; amount: number }> = {};

      // 년도별 초기화
      for (const year of years) {
        yearTotals[`${year}년`] = { count: 0, amount: 0 };
        for (let m = 1; m <= 12; m++) {
          const cellId = getCellId(year, m);
          pivot[cellId] = { count: 0, amount: 0 };
        }
      }

      // 월별 총계 초기화
      for (let m = 1; m <= 12; m++) {
        monthTotals[months[m - 1]] = { count: 0, amount: 0 };
      }

      // 데이터 집계
      completed.forEach((t: any) => {
        const d = new Date(t.finished);
        if (isNaN(d.getTime())) return;

        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const amount = Number(t.localSourceAmt ?? t.sourceAmt) || 0;

        const cellId = getCellId(year, month);
        if (pivot[cellId]) {
          pivot[cellId].count += 1;
          pivot[cellId].amount += amount;
        }

        // 년도별 총계
        const yearKey = `${year}년`;
        if (yearTotals[yearKey]) {
          yearTotals[yearKey].count += 1;
          yearTotals[yearKey].amount += amount;
        }

        // 월별 총계
        const monthKey = months[month - 1];
        if (monthTotals[monthKey]) {
          monthTotals[monthKey].count += 1;
          monthTotals[monthKey].amount += amount;
        }
      });

      // 전체 총계
      const grandTotal = {
        count: completed.length,
        amount: completed.reduce(
          (s: number, t: any) =>
            s + (Number(t.localSourceAmt ?? t.sourceAmt) || 0),
          0
        ),
      };

      return {
        data: pivot,
        rows: years.map((y) => `${y}년`),
        headers: months,
        rowTotals: yearTotals,
        colTotals: monthTotals,
        grandTotal,
      };
    }, [filteredData]);

  const customGetCellId = (row: string, col: string) => {
    const year = parseInt(row.replace("년", ""));
    const month = parseInt(col.replace("월", ""));
    return getCellId(year, month);
  };

  return (
    <PivotTable
      title="전체 송금량 "
      data={data}
      getCellId={customGetCellId}
      headers={headers}
      rows={rows}
      rowTotals={rowTotals}
      colTotals={colTotals}
      grandTotal={grandTotal}
    />
  );
}
