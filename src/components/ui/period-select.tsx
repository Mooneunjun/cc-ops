import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodSelectProps {
  period: string;
  setPeriod: (period: string) => void;
  date?: Date;
  setDate: (date: Date | undefined) => void;
}

export const PeriodSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  PeriodSelectProps
>(({ period, setPeriod, date, setDate, ...props }, ref) => {
  const handleValueChange = (value: string) => {
    setPeriod(value);

    if (date) {
      const newDate = new Date(date);
      const currentHours = newDate.getHours();

      if (value === "AM" && currentHours >= 12) {
        newDate.setHours(currentHours - 12);
      } else if (value === "PM" && currentHours < 12) {
        newDate.setHours(currentHours + 12);
      }

      setDate(newDate);
    }
  };

  return (
    <Select value={period} onValueChange={handleValueChange}>
      <SelectTrigger
        ref={ref}
        className="w-[65px] focus:bg-accent focus:text-accent-foreground"
        {...props}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="AM">오전</SelectItem>
        <SelectItem value="PM">오후</SelectItem>
      </SelectContent>
    </Select>
  );
});
