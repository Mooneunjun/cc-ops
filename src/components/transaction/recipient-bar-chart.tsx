"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

interface RecipientBarChartProps {
  data: Array<{
    send: string;
    reciFullName: string;
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

export function RecipientBarChart({ data }: RecipientBarChartProps) {
  // 수취인별 송금량 집계
  const recipientData = data.reduce((acc, transaction) => {
    const recipient = transaction.reciFullName || "Unknown";
    const amount =
      Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;
    const country = transaction.send || "KR";

    if (!acc[recipient]) {
      acc[recipient] = {
        name: recipient,
        amount: 0,
        count: 0,
        country: country,
      };
    }

    acc[recipient].amount += amount;
    acc[recipient].count += 1;
    return acc;
  }, {} as Record<string, { name: string; amount: number; count: number; country: string }>);

  // 상위 10명의 수취인만 표시
  const chartData = Object.values(recipientData)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((item, index) => {
      // shadcn/ui 블루 색상 팔레트
      const blueShades = [
        "hsl(221.2 83.2% 53.3%)", // blue-500
        "hsl(217.2 91.2% 59.8%)", // blue-400
        "hsl(213.1 93.9% 67.8%)", // blue-300
        "hsl(210 98% 78%)", // blue-200
        "hsl(214.3 77.8% 84.1%)", // blue-100
        "hsl(221.2 83.2% 53.3%)", // blue-500 반복
        "hsl(224.3 76.3% 48%)", // blue-600
        "hsl(225.9 70.7% 40.2%)", // blue-700
        "hsl(224.4 64.3% 32.9%)", // blue-800
        "hsl(223.8 55.1% 25.1%)", // blue-900
      ];

      return {
        recipient:
          item.name.length > 12
            ? `${item.name.substring(0, 12)}...`
            : item.name,
        amount: item.amount,
        count: item.count,
        fill: blueShades[index % blueShades.length],
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
    },
  };

  // 데이터가 없을 때 빈 상태 처리
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Remittance by Recipient</CardTitle>
          <CardDescription>
            Top 10 recipients by remittance volume
          </CardDescription>
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
      <CardHeader>
        <CardTitle>Remittance by Recipient</CardTitle>
        <CardDescription>
          Top 10 recipients by remittance volume ({currency})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="recipient"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={80}
              tick={{ fontSize: 11 }}
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="min-w-[160px]"
                  formatter={(value, _name, item) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-[2px]"
                        style={{
                          backgroundColor: item?.color || item?.payload?.fill,
                        }}
                      />
                      <span className="text-sm">
                        {currencySymbol}
                        {Number(value as number).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="amount"
              layout="vertical"
              radius={6}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
