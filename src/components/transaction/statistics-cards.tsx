import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount, getCurrencyBySendingCountry } from "./transaction-utils";

interface StatisticsCardsProps {
  filteredData: any[];
}

export function StatisticsCards({ filteredData }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">지급완료 기간</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {(() => {
              const completedTransactions = filteredData.filter(
                (transaction: any) => transaction.status === "지급완료"
              );
              if (completedTransactions.length === 0) return "-";
              const dates = completedTransactions
                .map((t: any) => new Date(t.finished))
                .filter((date: Date) => !isNaN(date.getTime()))
                .sort((a: Date, b: Date) => a.getTime() - b.getTime());
              if (dates.length === 0) return "-";
              const formatDate = (date: Date) => {
                return date.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
              };
              return dates.length === 1
                ? formatDate(dates[0])
                : `${formatDate(dates[0])} ~ ${formatDate(
                    dates[dates.length - 1]
                  )}`;
            })()}
          </div>
          <p className="text-xs text-muted-foreground">지급완료 기준</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">지급 완료 건수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {
              filteredData.filter(
                (transaction: any) => transaction.status === "지급완료"
              ).length
            }
            건
          </div>
          <p className="text-xs text-muted-foreground">지급완료 기준</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            최대 로컬 송금금액
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {(() => {
              const completedTransactions = filteredData.filter(
                (transaction: any) => transaction.status === "지급완료"
              );
              if (completedTransactions.length === 0) return "-";
              const maxTransaction = completedTransactions.reduce((max: any, t: any) => {
                const amount = Number(t.localSourceAmt ?? t.sourceAmt) || 0;
                const maxAmount = Number(max.localSourceAmt ?? max.sourceAmt) || 0;
                return amount > maxAmount ? t : max;
              });
              const maxAmount = Number(maxTransaction.localSourceAmt ?? maxTransaction.sourceAmt) || 0;
              if (maxAmount === 0) return "-";
              const currency = getCurrencyBySendingCountry(maxTransaction.send);
              return `${formatAmount(maxAmount)} ${currency}`;
            })()}
          </div>
          <p className="text-xs text-muted-foreground">지급완료 기준</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            평균 로컬 송금금액
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {(() => {
              const completedTransactions = filteredData.filter(
                (transaction: any) => transaction.status === "지급완료"
              );
              if (completedTransactions.length === 0) return "-";
              const amounts = completedTransactions
                .map((t: any) => Number(t.localSourceAmt ?? t.sourceAmt) || 0)
                .filter((amount: number) => amount > 0);
              if (amounts.length === 0) return "-";
              const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
              const currency = getCurrencyBySendingCountry(completedTransactions[0].send);
              return `${formatAmount(Math.round(avgAmount))} ${currency}`;
            })()}
          </div>
          <p className="text-xs text-muted-foreground">지급완료 기준</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            중위 로컬 송금금액
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {(() => {
              const completedTransactions = filteredData.filter(
                (transaction: any) => transaction.status === "지급완료"
              );
              if (completedTransactions.length === 0) return "-";
              const amounts = completedTransactions
                .map((t: any) => Number(t.localSourceAmt ?? t.sourceAmt) || 0)
                .filter((amount: number) => amount > 0)
                .sort((a: number, b: number) => a - b);
              if (amounts.length === 0) return "-";
              const middle = Math.floor(amounts.length / 2);
              const median =
                amounts.length % 2 === 0
                  ? (amounts[middle - 1] + amounts[middle]) / 2
                  : amounts[middle];
              const currency = getCurrencyBySendingCountry(completedTransactions[0].send);
              return `${formatAmount(Math.round(median))} ${currency}`;
            })()}
          </div>
          <p className="text-xs text-muted-foreground">지급완료 기준</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            총 로컬 송금금액
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {(() => {
              const completedTransactions = filteredData.filter(
                (transaction: any) => transaction.status === "지급완료"
              );
              if (completedTransactions.length === 0) return "-";
              const totalAmount = completedTransactions.reduce(
                (sum: number, t: any) =>
                  sum + (Number(t.localSourceAmt ?? t.sourceAmt) || 0),
                0
              );
              const currency = getCurrencyBySendingCountry(completedTransactions[0].send);
              return `${formatAmount(totalAmount)} ${currency}`;
            })()}
          </div>
          <p className="text-xs text-muted-foreground">지급완료 기준</p>
        </CardContent>
      </Card>
    </div>
  );
}
