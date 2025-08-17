import { formatAmount } from "./transaction-utils";

interface AmountDisplayProps {
  amount: string | number;
  currency?: string;
  className?: string;
}

export function AmountDisplay({ amount, currency, className = "" }: AmountDisplayProps) {
  return (
    <span className={className}>
      {formatAmount(amount)}
      {currency && ` ${currency}`}
    </span>
  );
}