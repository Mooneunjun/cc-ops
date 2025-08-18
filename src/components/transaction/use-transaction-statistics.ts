import { useMemo } from "react";

export type StatisticType = "sum" | "avg" | "max" | "min" | "count";

export interface PivotData {
  [year: number]: {
    [month: number]: {
      count: number;
      amount: number;
    };
  };
}

export function useTransactionStatistics(
  filteredData: any[],
  selectedCells: Set<string>,
  statisticType: StatisticType
) {
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

    const pivotData: PivotData = {};
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
      const amount =
        Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;

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

  // 피벗 데이터도 반환해서 테이블에서 사용할 수 있도록
  const pivotData = useMemo(() => {
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

    const data: PivotData = {};
    for (const year of years) {
      data[year] = {};
      for (let month = 1; month <= 12; month++) {
        data[year][month] = { count: 0, amount: 0 };
      }
    }

    completedTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.finished);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const amount =
        Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;

      if (data[year] && data[year][month]) {
        data[year][month].count += 1;
        data[year][month].amount += amount;
      }
    });

    return data;
  }, [filteredData]);

  return {
    calculateStatistic,
    pivotData,
    years: Object.keys(pivotData)
      .map(Number)
      .sort((a, b) => a - b),
  };
}
