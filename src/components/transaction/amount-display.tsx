
interface AmountDisplayProps {
  amount: string | number;
  currency?: string;
  className?: string;
}

export function AmountDisplay({ amount, currency, className = "" }: AmountDisplayProps) {
  const formatAmount = (amount: string | number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR").format(Number(amount));
  };

  return (
    <span className={className}>
      {formatAmount(amount)}
      {currency && ` ${currency}`}
    </span>
  );
}