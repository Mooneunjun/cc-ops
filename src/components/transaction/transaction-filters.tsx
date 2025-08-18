"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SearchFilter } from "./search-filter";
import { StatusBadge } from "./status-badge";

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;

  uniqueStatuses: string[];
  selectedStatuses: string[];
  onStatusToggle: (status: string, checked: boolean) => void;

  uniqueRecipients: string[];
  selectedRecipients: string[];
  onRecipientToggle: (recipient: string, checked: boolean) => void;

  minAmount: string;
  maxAmount: string;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;

  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function TransactionFilters(props: TransactionFiltersProps) {
  const {
    searchTerm,
    onSearchChange,
    onClearFilters,
    uniqueStatuses,
    selectedStatuses,
    onStatusToggle,
    uniqueRecipients,
    selectedRecipients,
    onRecipientToggle,
    minAmount,
    maxAmount,
    onMinAmountChange,
    onMaxAmountChange,
    dateRange,
    onDateRangeChange,
  } = props;

  return (
    <div className="space-y-6">
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onClearFilters={onClearFilters}
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
                    onStatusToggle(status as string, checked)
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
                    onRecipientToggle(recipient as string, checked)
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
              onChange={(e) => onMinAmountChange(e.target.value)}
            />
            <span className="flex items-center">~</span>
            <Input
              type="number"
              placeholder="최대"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange(e.target.value)}
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
                      {format(dateRange.from, "yyyy/MM/dd", { locale: ko })} -{" "}
                      {format(dateRange.to, "yyyy/MM/dd", { locale: ko })}
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
                onSelect={onDateRangeChange}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
