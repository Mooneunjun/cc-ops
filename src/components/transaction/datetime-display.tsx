interface DateTimeDisplayProps {
  dateTime: string;
  className?: string;
}

export function DateTimeDisplay({ dateTime, className = "" }: DateTimeDisplayProps) {
  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <span className={className}>
      {formatDateTime(dateTime)}
    </span>
  );
}