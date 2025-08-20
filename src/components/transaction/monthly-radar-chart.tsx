"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getCurrencyBySendingCountry } from "./transaction-utils";

interface MonthlyRadarChartProps {
  data: Array<{
    send: string;
    finished: string;
    localSourceAmt?: number;
    sourceAmt: number;
  }>;
}

// 통화별 기호 매핑
const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case "USD":
      return "$";
    case "AUD":
      return "A$";
    case "NZD":
      return "NZ$";
    case "HKD":
      return "HK$";
    case "CAD":
      return "C$";
    case "KRW":
    default:
      return "₩";
  }
};

export function MonthlyRadarChart({ data }: MonthlyRadarChartProps) {
  // 월별 송금량 집계
  const monthlyData = data.reduce((acc, transaction) => {
    const date = new Date(transaction.finished);
    if (isNaN(date.getTime())) return acc;

    const month = date.getMonth() + 1; // 1-12
    const amount =
      Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;

    if (!acc[month]) {
      acc[month] = {
        month: month,
        amount: 0,
        count: 0,
      };
    }

    acc[month].amount += amount;
    acc[month].count += 1;
    return acc;
  }, {} as Record<number, { month: number; amount: number; count: number }>);

  // 월 이름 매핑
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // 차트 데이터 생성 (1-12월 모두 포함)
  const chartData = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthData = monthlyData[month];
    return {
      month: monthNames[index],
      amount: monthData?.amount || 0,
      count: monthData?.count || 0,
    };
  });

  // 주요 송금국가 파악
  const countryAmounts = data.reduce(
    (acc: Record<string, number>, transaction) => {
      const country = transaction.send || "KR";
      const amount = transaction.localSourceAmt ?? transaction.sourceAmt;
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

  const currency = getCurrencyBySendingCountry(dominantCountry);
  const currencySymbol = getCurrencySymbol(currency);

  const chartConfig: ChartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(221.2 83.2% 53.3%)", // shadcn/ui blue-500
    },
  };

  // 통계 계산
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);

  // 데이터가 없을 때 빈 상태 처리
  if (totalAmount === 0) {
    return (
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Monthly Remittance Pattern</CardTitle>
          <CardDescription>Annual remittance distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground text-center">
            <p>No data to display.</p>
            <p className="text-sm mt-1">Please check completed transactions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Monthly Remittance Pattern</CardTitle>
        <CardDescription>
          Annual remittance distribution ({currency})
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="min-w-[160px]"
                  hideLabel
                  formatter={(value, _name, item) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-[2px]"
                        style={{
                          backgroundColor: item?.color || item?.payload?.fill,
                        }}
                      />
                      <span className="text-sm font-medium">
                        {item?.payload?.month}
                      </span>
                      <span className="text-sm">
                        {currencySymbol}
                        {Number(value as number).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <PolarGrid className="fill-[--color-amount] opacity-20" />
            <PolarAngleAxis dataKey="month" />
            <Radar
              dataKey="amount"
              fill="var(--color-amount)"
              fillOpacity={0.5}
              stroke="var(--color-amount)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
