import { format } from "date-fns";
import { ko } from "date-fns/locale";

// 셀 ID 생성 유틸리티
export const getCellId = (year: number, month: number) => `${year}-${month}`;

// 금액 포맷팅 유틸리티
export const formatAmount = (amount: string | number) => {
  return Number(amount).toLocaleString("ko-KR");
};

// 송금 당발 국가 코드를 통화 코드로 매핑
export const getCurrencyBySendingCountry = (sendCountry?: string) => {
  switch ((sendCountry || "").toUpperCase()) {
    case "KR":
      return "KRW";
    case "AU":
      return "AUD";
    case "NZ":
      return "NZD";
    case "HK":
      return "HKD";
    case "US":
      return "USD";
    case "CA":
      return "CAD";
    default:
      return "KRW";
  }
};

// 날짜/시간 포맷팅 유틸리티
export const formatDateTime = (dateTime: string) => {
  try {
    const date = new Date(dateTime);
    return format(date, "yyyy-MM-dd HH:mm", { locale: ko });
  } catch (error) {
    return dateTime;
  }
};

// 날짜 범위 포맷팅 유틸리티 (캘린더용)
export const formatDateForCalendar = (date: Date) => {
  return format(date, "yyyy/MM/dd", { locale: ko });
};

// 상태 배지 클래스 유틸리티
export const getStatusBadgeClass = (status: string) => {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (status) {
    case "지급완료":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "송금거절":
      return `${baseClasses} bg-red-100 text-red-800`;
    case "지급준비중":
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case "지급진행중":
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case "환불준비중":
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case "환불완료":
      return `${baseClasses} bg-purple-100 text-purple-800`;
    case "환불진행중":
      return `${baseClasses} bg-purple-100 text-purple-800`;
    case "시간초과":
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};
