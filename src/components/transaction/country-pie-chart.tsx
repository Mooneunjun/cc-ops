"use client";

import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

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

interface CountryPieChartProps {
  data: Array<{
    send: string;
    receive: string;
    localSourceAmt?: number;
    sourceAmt: number;
  }>;
}

// 국가명 매핑
const getCountryName = (countryCode: string) => {
  switch (countryCode?.toUpperCase()) {
    case "KR":
      return "한국";
    case "US":
      return "미국";
    case "AU":
      return "호주";
    case "NZ":
      return "뉴질랜드";
    case "HK":
      return "홍콩";
    case "CA":
      return "캐나다";
    case "JP":
      return "일본";
    case "CN":
      return "중국";
    case "SG":
      return "싱가포르";
    case "TH":
      return "태국";
    case "VN":
      return "베트남";
    case "PH":
      return "필리핀";
    default:
      return countryCode || "기타";
  }
};

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

export function CountryPieChart({ data }: CountryPieChartProps) {
  // 지급국가별 송금량 집계
  const countryData = data.reduce((acc, transaction) => {
    const receiveCountry = transaction.receive || "Unknown";
    const amount =
      Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;

    if (!acc[receiveCountry]) {
      acc[receiveCountry] = {
        country: receiveCountry,
        amount: 0,
        count: 0,
      };
    }

    acc[receiveCountry].amount += amount;
    acc[receiveCountry].count += 1;
    return acc;
  }, {} as Record<string, { country: string; amount: number; count: number }>);

  // 차트 데이터 생성
  const chartData = Object.values(countryData)
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      country: getCountryName(item.country),
      countryCode: item.country,
      amount: item.amount,
      count: item.count,
      fill: `var(--color-${item.country.toLowerCase()})`,
    }));

  // 주요 송금국가 파악 (송금국가 기준)
  const sendCountryAmounts = data.reduce(
    (acc: Record<string, number>, transaction) => {
      const country = transaction.send || "KR";
      const amount = transaction.localSourceAmt ?? transaction.sourceAmt;
      acc[country] = (acc[country] || 0) + amount;
      return acc;
    },
    {}
  );

  const dominantSendCountry = Object.entries(sendCountryAmounts).reduce(
    (max, [country, amount]) =>
      amount > max.amount ? { country, amount } : max,
    { country: "KR", amount: 0 }
  ).country;

  const currency = getCurrencyBySendingCountry(dominantSendCountry);
  const currencySymbol = getCurrencySymbol(currency);

  // 차트 설정 동적 생성
  const chartConfig: ChartConfig = {
    amount: {
      label: "Amount",
    },
  };

  // shadcn/ui 블루 색상 팔레트
  const blueShades = [
    "hsl(221.2 83.2% 53.3%)", // blue-500
    "hsl(217.2 91.2% 59.8%)", // blue-400
    "hsl(213.1 93.9% 67.8%)", // blue-300
    "hsl(210 98% 78%)", // blue-200
    "hsl(214.3 77.8% 84.1%)", // blue-100
    "hsl(224.3 76.3% 48%)", // blue-600
  ];

  chartData.forEach((item, index) => {
    chartConfig[item.countryCode.toLowerCase()] = {
      label: item.country,
      color: blueShades[index % blueShades.length],
    };
  });

  // 데이터가 없을 때 빈 상태 처리
  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Remittance Distribution by Country</CardTitle>
          <CardDescription>Remittance status by country</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-muted-foreground text-center">
            <p>No data to display.</p>
            <p className="text-sm mt-1">Please check completed transactions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Remittance Distribution by Country</CardTitle>
        <CardDescription>
          Remittance status by country ({currency})
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="min-w-[160px]"
                  formatter={(value: number, _name: string, item: any) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-[2px]"
                        style={{
                          backgroundColor: item?.color || item?.payload?.fill,
                        }}
                      />
                      <span className="text-sm font-medium">
                        {item?.payload?.country}: {currencySymbol}
                        {Number(value).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="country"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={0}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
