"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RemittancePatternChartProps {
  data: Array<{
    month: string;
    year: number;
    amount: number;
    count: number;
    currency?: string;
    dominantCountry?: string;
  }>;
}

// shadcn/ui 블루 색상 팔레트
const modernBlueColors = [
  "hsl(221.2 83.2% 53.3%)", // blue-500
  "hsl(217.2 91.2% 59.8%)", // blue-400
  "hsl(213.1 93.9% 67.8%)", // blue-300
  "hsl(224.3 76.3% 48%)", // blue-600
  "hsl(225.9 70.7% 40.2%)", // blue-700
  "hsl(224.4 64.3% 32.9%)", // blue-800
];

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

export function RemittancePatternChart({ data }: RemittancePatternChartProps) {
  const [activeYear, setActiveYear] = React.useState<number | null>(null);
  const safeData = Array.isArray(data) ? data : [];

  // 연도별로 데이터 그룹화
  const yearlyData = safeData.reduce((acc, item) => {
    if (!acc[item.year]) {
      acc[item.year] = {};
    }
    const monthNum = parseInt(item.month.replace("월", ""));
    acc[item.year][monthNum] = item.amount;
    return acc;
  }, {} as Record<number, Record<number, number>>);

  const years = Object.keys(yearlyData).map(Number).sort();

  // 1월부터 12월까지 모든 월 데이터 생성
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

  const chartData = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthData: Record<string, number | string> = {
      month: monthNames[index],
    };

    years.forEach((year) => {
      monthData[`year_${year}`] = yearlyData[year]?.[month] || 0;
    });

    return monthData;
  });

  // 차트 데이터가 유효한지 확인
  const hasValidData = chartData.some((monthData) =>
    Object.keys(monthData).some((key) => {
      if (!key.startsWith("year_")) return false;
      const val = (monthData as Record<string, number | string>)[key];
      return typeof val === "number" && val > 0;
    })
  );

  // 동적 차트 설정 생성
  const chartConfig: ChartConfig = {};
  years.forEach((year, index) => {
    chartConfig[`year_${year}`] = {
      label: `${year}`,
      color: modernBlueColors[index % modernBlueColors.length],
    };
  });

  const totalAmounts = years.reduce((acc, year) => {
    acc[year] = Object.values(yearlyData[year] || {}).reduce(
      (sum, amount) => sum + amount,
      0
    );
    return acc;
  }, {} as Record<number, number>);

  const grandTotal = Object.values(totalAmounts).reduce(
    (sum, amount) => sum + amount,
    0
  );

  // 주요 통화 정보 추출 (첫 번째 데이터 항목에서)
  const currency = data[0]?.currency || "KRW";
  const currencySymbol = getCurrencySymbol(currency);
  const dominantCountry = data[0]?.dominantCountry || "KR";

  // 초기에는 전체 보기로 시작 (activeYear = null)

  return (
    <Card className="p-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Remittance Pattern Analysis</CardTitle>
          <CardDescription>
            Monthly remittance trends (
            {dominantCountry === "KR"
              ? "Korea"
              : dominantCountry === "US"
              ? "United States"
              : dominantCountry === "AU"
              ? "Australia"
              : dominantCountry === "NZ"
              ? "New Zealand"
              : dominantCountry === "HK"
              ? "Hong Kong"
              : dominantCountry === "CA"
              ? "Canada"
              : dominantCountry}{" "}
            based, {currency})
          </CardDescription>
        </div>
        <div className="flex flex-wrap">
          <button
            data-active={activeYear === null}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6 hover:bg-muted/30 transition-colors"
            onClick={() => setActiveYear(null)}
          >
            <span className="text-muted-foreground text-xs">Total Amount</span>
            <span className="text-base leading-none font-bold sm:text-lg">
              {currencySymbol}
              {grandTotal.toLocaleString()}
            </span>
          </button>
          {years.map((year, index) => (
            <button
              key={year}
              data-active={activeYear === year}
              className="data-[active=true]:bg-muted/50 flex flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-6 min-w-[160px] w-[160px] hover:bg-muted/30 transition-colors"
              onClick={() => setActiveYear(year)}
            >
              <span className="text-muted-foreground text-xs">{year}</span>
              <span className="text-sm leading-none font-bold sm:text-base truncate">
                {currencySymbol}
                {totalAmounts[year].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:p-6">
        <div style={{ width: "100%", height: "350px" }}>
          <ChartContainer
            config={chartConfig}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          >
            <AreaChart
              data={chartData}
              width={800}
              height={320}
              margin={{
                top: 10,
                left: 12,
                right: 12,
                bottom: 10,
              }}
            >
              <defs>
                {years.map((year, index) => (
                  <linearGradient
                    key={year}
                    id={`gradient-${year}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={
                        modernBlueColors[index % modernBlueColors.length]
                      }
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        modernBlueColors[index % modernBlueColors.length]
                      }
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;

                  // 전체 보기: 전체 payload 유지, 선택 모드: 해당 연도만 필터링
                  const effectivePayload =
                    activeYear === null
                      ? payload
                      : payload.filter(
                          (item) => item.dataKey === `year_${activeYear}`
                        );

                  if (!effectivePayload.length) return null;

                  // shadcn/ui 기본 툴팁 컴포넌트로 통일 (라벨: 월, 항목: 연도 라벨 + 값)
                  return (
                    <ChartTooltipContent
                      active={active}
                      payload={effectivePayload}
                      label={label}
                      className="min-w-[160px]"
                    />
                  );
                }}
              />
              {years.map((year, index) => {
                const isActive = activeYear === year || activeYear === null;

                // 특정 연도 선택 시(activeYear !== null) 선택된 연도만 렌더링하여
                // 다른 연도의 값이 시각적으로 섞이지 않도록 처리
                if (activeYear !== null && !isActive) {
                  return null;
                }

                return (
                  <Area
                    key={year}
                    dataKey={`year_${year}`}
                    type="monotone"
                    fill={`url(#gradient-${year})`}
                    stroke={modernBlueColors[index % modernBlueColors.length]}
                    strokeWidth={2}
                  />
                );
              })}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
