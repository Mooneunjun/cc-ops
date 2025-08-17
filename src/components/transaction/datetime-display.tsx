import { formatDateTime } from "./transaction-utils";

interface DateTimeDisplayProps {
  dateTime: string;
  className?: string;
}

export function DateTimeDisplay({ dateTime, className = "" }: DateTimeDisplayProps) {
  return (
    <span className={className}>
      {formatDateTime(dateTime)}
    </span>
  );
}