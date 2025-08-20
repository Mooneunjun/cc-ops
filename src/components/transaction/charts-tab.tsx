import { useMemo } from "react";
import dynamic from "next/dynamic";
import { getCurrencyBySendingCountry } from "./transaction-utils";

const RemittancePatternChart = dynamic(
  () =>
    import("./remittance-pattern-chart").then((mod) => ({
      default: mod.RemittancePatternChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">차트 로딩 중...</p>
      </div>
    ),
  }
);

const RecipientBarChart = dynamic(
  () =>
    import("./recipient-bar-chart").then((mod) => ({
      default: mod.RecipientBarChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">차트 로딩 중...</p>
      </div>
    ),
  }
);

const CountryPieChart = dynamic(
  () =>
    import("./country-pie-chart").then((mod) => ({
      default: mod.CountryPieChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">차트 로딩 중...</p>
      </div>
    ),
  }
);

const MonthlyRadarChart = dynamic(
  () =>
    import("./monthly-radar-chart").then((mod) => ({
      default: mod.MonthlyRadarChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">차트 로딩 중...</p>
      </div>
    ),
  }
);

interface ChartsTabProps {
  filteredData: any[];
}

export function ChartsTab({ filteredData }: ChartsTabProps) {
  const chartData = useMemo(() => {
    const completedTransactions = filteredData.filter(
      (transaction: any) => transaction.status === "지급완료"
    );

    // 주요 송금국가 파악 (가장 많은 거래량을 가진 국가)
    const countryAmounts = completedTransactions.reduce(
      (acc: Record<string, number>, transaction: any) => {
        const country = transaction.send || "KR";
        const amount =
          Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;
        acc[country] = (acc[country] || 0) + amount;
        return acc;
      },
      {}
    );

    const dominantCountry = Object.entries(countryAmounts).reduce(
      (max, [country, amount]) =>
        amount > max.amount ? { country, amount } : max,
      { country: "KR", amount: 0 }
    ).country;

    const dominantCurrency = getCurrencyBySendingCountry(dominantCountry);

    // 연도별, 월별로 데이터를 집계
    const yearMonthData: Record<
      string,
      {
        amount: number;
        count: number;
        year: number;
        month: string;
        currency: string;
        dominantCountry: string;
      }
    > = {};

    completedTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.finished);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      const amount =
        Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;

      if (!yearMonthData[key]) {
        yearMonthData[key] = {
          amount: 0,
          count: 0,
          year,
          month: `${month}월`,
          currency: dominantCurrency,
          dominantCountry: dominantCountry,
        };
      }

      yearMonthData[key].amount += amount;
      yearMonthData[key].count += 1;
    });

    return Object.values(yearMonthData);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* 월별 송금량 패턴 차트 */}
      <RemittancePatternChart data={chartData} />

      {/* 하단 차트들 - 3개 차트 한 줄 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 수취인별 송금량 바 차트 */}
        <RecipientBarChart
          data={filteredData.filter((t) => t.status === "지급완료")}
        />

        {/* 지급국가별 파이 차트 */}
        <CountryPieChart
          data={filteredData.filter((t) => t.status === "지급완료")}
        />

        {/* 월별 송금 패턴 레이더 차트 */}
        <MonthlyRadarChart
          data={filteredData.filter((t) => t.status === "지급완료")}
        />
      </div>
    </div>
  );
}
