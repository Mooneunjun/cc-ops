"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  PolarRadiusAxis,
} from "recharts";

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
  ChartTooltip,
} from "@/components/ui/chart";

interface MonthlyRadarChartProps {
  data: Array<{
    send: string;
    receive: string;
    finished: string;
    localSourceAmt?: number;
    sourceAmt: number;
    reciFullName: string;
  }>;
}

export function MonthlyRadarChart({ data }: MonthlyRadarChartProps) {
  // 연도별 2개월 단위 송금량 집계 데이터 생성
  const { chartData, years } = (() => {
    // 연도별 2개월씩 묶어서 집계
    const yearlyBiMonthlyData: Record<string, Record<string, { amount: number; count: number }>> = {};

    const biMonthMapping = [
      "Jan-Feb", "Jan-Feb", "Mar-Apr", "Mar-Apr", 
      "May-Jun", "May-Jun", "Jul-Aug", "Jul-Aug",
      "Sep-Oct", "Sep-Oct", "Nov-Dec", "Nov-Dec"
    ];

    const periods = ["Jan-Feb", "Mar-Apr", "May-Jun", "Jul-Aug", "Sep-Oct", "Nov-Dec"];

    data.forEach((transaction) => {
      const date = new Date(transaction.finished);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear().toString();
      const month = date.getMonth(); // 0-11
      const amount = Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;
      const biMonthKey = biMonthMapping[month];

      if (!yearlyBiMonthlyData[year]) {
        yearlyBiMonthlyData[year] = {};
        periods.forEach(period => {
          yearlyBiMonthlyData[year][period] = { amount: 0, count: 0 };
        });
      }

      yearlyBiMonthlyData[year][biMonthKey].amount += amount;
      yearlyBiMonthlyData[year][biMonthKey].count += 1;
    });

    // 연도별 최대값 찾기 (각 연도별로 정규화)
    const yearMaxAmounts: Record<string, number> = {};
    Object.entries(yearlyBiMonthlyData).forEach(([year, yearData]) => {
      const amounts = Object.values(yearData).map(d => d.amount);
      yearMaxAmounts[year] = Math.max(...amounts, 1);
    });

    // 차트 데이터 생성
    const chartData = periods.map(period => {
      const dataPoint: any = { category: period };
      
      Object.entries(yearlyBiMonthlyData).forEach(([year, yearData]) => {
        const periodData = yearData[period];
        const maxForYear = yearMaxAmounts[year];
        dataPoint[`amount_${year}`] = periodData.amount;
        dataPoint[`value_${year}`] = maxForYear > 0 ? (periodData.amount / maxForYear) * 100 : 0;
      });
      
      return dataPoint;
    });

    const years = Object.keys(yearlyBiMonthlyData).sort();
    
    return { chartData, years };
  })();

  // 주요 송금국가 파악 (통화 표시용)
  const countryAmounts = data.reduce(
    (acc: Record<string, number>, transaction) => {
      const country = transaction.send || "KR";
      const amount = Number(transaction.localSourceAmt ?? transaction.sourceAmt) || 0;
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

  // 통화별 기호 매핑
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD": return "$";
      case "AUD": return "A$";
      case "NZD": return "NZ$";
      case "HKD": return "HK$";
      case "CAD": return "C$";
      case "KRW": 
      default: return "₩";
    }
  };

  const getCurrencyBySendingCountry = (country: string) => {
    switch (country?.toLowerCase()) {
      case "us": return "USD";
      case "au": return "AUD";
      case "nz": return "NZD";
      case "hk": return "HKD";
      case "ca": return "CAD";
      case "kr":
      default: return "KRW";
    }
  };

  const currency = getCurrencyBySendingCountry(dominantCountry);
  const currencySymbol = getCurrencySymbol(currency);

  // 연도별 색상 설정
  const chartConfig: ChartConfig = {};
  const colors = [
    "hsl(221.2 83.2% 53.3%)", // blue-500
    "hsl(142.1 76.2% 36.3%)", // green-500
    "hsl(38.0 92.0% 50.0%)", // yellow-500
    "hsl(346.8 77.2% 49.8%)", // red-500
    "hsl(262.1 83.3% 57.8%)", // purple-500
  ];

  years.forEach((year, index) => {
    chartConfig[`value_${year}`] = {
      label: `${year}년`,
      color: colors[index % colors.length],
    };
  });

  // 데이터가 없을 때 빈 상태 처리
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Bi-Monthly Remittance Pattern</CardTitle>
          <CardDescription>
            Remittance volume by 2-month periods
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] p-0 pt-6 flex items-center justify-center">
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
        <CardTitle>Bi-Monthly Remittance Pattern</CardTitle>
        <CardDescription>
          Remittance volume by 2-month periods ({currency})
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] p-0 pt-6">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm min-w-[160px]">
                    <div className="mb-2 font-medium text-sm">{label}</div>
                    {payload.map((entry: any, index: number) => {
                      const year = entry.dataKey.split('_')[1];
                      const amount = entry.payload[`amount_${year}`];
                      
                      return (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <div
                            className="h-3 w-3 rounded-[2px]"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium">{year}년</span>
                          <span className="text-sm">
                            {currencySymbol}
                            {Number(amount || 0).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            <PolarGrid className="fill-[--color-value] opacity-20" />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            {years.map((year, index) => (
              <Radar
                key={year}
                dataKey={`value_${year}`}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.1}
                strokeWidth={2}
                name={`${year}년`}
              />
            ))}
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
