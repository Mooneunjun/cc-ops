import { getStatusBadgeClass } from "./transaction-utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
}