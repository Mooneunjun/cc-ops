import { useMemo } from "react";
import type { DateRange } from "react-day-picker";

export interface FilterOptions {
  searchTerm: string;
  selectedStatuses: string[];
  selectedRecipients: string[];
  minAmount: string;
  maxAmount: string;
  dateRange?: DateRange;
}

export function useTransactionFilter(
  data: any[],
  filterOptions: FilterOptions
) {
  const {
    searchTerm,
    selectedStatuses,
    selectedRecipients,
    minAmount,
    maxAmount,
    dateRange,
  } = filterOptions;

  const filteredData = useMemo(() => {
    let filtered = data || [];
    
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
    data,
    searchTerm,
    selectedStatuses,
    selectedRecipients,
    minAmount,
    maxAmount,
    dateRange,
  ]);

  return filteredData;
}