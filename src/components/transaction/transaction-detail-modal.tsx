"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface TransactionDetailModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const formatAmount = (amount: string | number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR").format(Number(amount));
  };

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

  const getStatusBadge = (status: string) => {
    const getStatusClass = (status: string) => {
      switch (status) {
        case "지급완료":
          return "bg-green-100 text-green-800 border-green-200";
        case "송금거절":
          return "bg-red-100 text-red-800 border-red-200";
        case "지급준비중":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "지급진행중":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "환불준비중":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "환불완료":
          return "bg-purple-100 text-purple-800 border-purple-200";
        case "환불진행중":
          return "bg-purple-100 text-purple-800 border-purple-200";
        case "시간초과":
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getStatusClass(
          status
        )}`}
      >
        {status}
      </span>
    );
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-screen max-w-none max-h-none sm:max-w-[85vw] sm:max-h-[90vh] sm:h-auto p-0">
        <div className="flex flex-col h-full sm:max-h-[90vh]">
          <DialogHeader className="px-4 py-4 sm:px-6 border-b bg-background shrink-0 rounded-t-lg">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                거래 상세정보
              </DialogTitle>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 min-h-0">
            <div className="space-y-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">기본 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">ID</div>
                      <div className="font-mono">{transaction.id}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">송금번호</div>
                      <div className="font-mono font-medium">
                        {transaction.no}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        지급참조번호
                      </div>
                      <div className="font-mono">{transaction.refNo}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">회원번호</div>
                      <div className="font-mono">{transaction.senderId}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        송금유형(상세)
                      </div>
                      <div>{transaction.txType}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">송금상태</div>
                      {getStatusBadge(transaction.status)}
                    </div>
                    {transaction.txRejectDetailStatus && (
                      <div>
                        <div className="text-muted-foreground mb-1">
                          송금거절 상세상태
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {transaction.txRejectDetailStatus}
                        </Badge>
                      </div>
                    )}
                    {transaction.transferChangeRes !== undefined && (
                      <div>
                        <div className="text-muted-foreground mb-1">
                          지급상태여부
                        </div>
                        <div className="font-medium">
                          {transaction.transferChangeResDescr}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 송금 및 지급 정보 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">송금 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          송금인명
                        </div>
                        <div className="font-medium">
                          {transaction.sendFullName}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">국적</div>
                        <div>{transaction.senderDetailNationality}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          위험도등급
                        </div>
                        <Badge variant="secondary">
                          {transaction.senderDetailRisk}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          송금국가
                        </div>
                        <div className="font-medium">{transaction.send}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          송금통화
                        </div>
                        <div className="font-medium">{transaction.source}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          로컬 송금금액
                        </div>
                        <div className="font-semibold">
                          {formatAmount(transaction.sourceAmt)}{" "}
                          {transaction.source}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          입금 방식
                        </div>
                        <div className="text-xs">
                          {transaction.paymentOption}
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground mb-1">
                          총 입금액
                        </div>
                        <div className="font-semibold">
                          {formatAmount(transaction.totalAmt)}{" "}
                          {transaction.source}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          계좌주명
                        </div>
                        <div>{transaction.paymentAccName || "-"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">지급 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          수취인 ID
                        </div>
                        <div className="font-mono">
                          {transaction.detailRecipientId || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          수취인명
                        </div>
                        <div className="font-medium">
                          {transaction.reciFullName || "-"}
                        </div>
                      </div>
                      {transaction.detailReciEmail && (
                        <div>
                          <div className="text-muted-foreground mb-1">
                            이메일
                          </div>
                          <div className="text-sm">
                            {transaction.detailReciEmail}
                          </div>
                        </div>
                      )}
                      {transaction.detailReciMobile && (
                        <div>
                          <div className="text-muted-foreground mb-1">
                            연락처
                          </div>
                          <div>{transaction.detailReciMobile}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground mb-1">
                          지급국가
                        </div>
                        <div className="font-medium">{transaction.receive}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          지급통화
                        </div>
                        <div className="font-medium">{transaction.dest}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          지급금액
                        </div>
                        <div className="font-semibold">
                          {formatAmount(transaction.destAmt)} {transaction.dest}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          지급 방식
                        </div>
                        <div className="text-xs">
                          {transaction.transferOption}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          지급 은행 이름
                        </div>
                        <div>{transaction.transferBank || "-"}</div>
                      </div>
                      {transaction.transferReceiveNo && (
                        <div>
                          <div className="text-muted-foreground mb-1">
                            수취번호
                          </div>
                          <div className="font-medium">
                            {transaction.transferReceiveNo}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 환율 & 수수료 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">환율 & 수수료 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">제공환율</div>
                      <div className="font-medium">{transaction.rate}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        환율기준일시
                      </div>
                      <div>{formatDateTime(transaction.detailRateTime)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">수수료</div>
                      <div className="font-medium">
                        {formatAmount(transaction.fee)} {transaction.source}
                      </div>
                    </div>
                    {transaction.coupon !== undefined && (
                      <div>
                        <div className="text-muted-foreground mb-1">
                          쿠폰 할인
                        </div>
                        <div className="font-medium">
                          {formatAmount(transaction.coupon)}{" "}
                          {transaction.source}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 일정 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">일정 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">신청일시</div>
                      <div className="font-medium">
                        {formatDateTime(transaction.applied)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        결제 완료 일시
                      </div>
                      <div className="font-medium">
                        {formatDateTime(transaction.paid)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        송금승인 완료일시
                      </div>
                      <div className="font-medium">
                        {formatDateTime(transaction.detailSendApproved)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        지급 시작일시
                      </div>
                      <div className="font-medium">
                        {formatDateTime(transaction.transferTransfer)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        지급 예정일시
                      </div>
                      <div className="font-medium">
                        {formatDateTime(transaction.transferEstimated)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        지급 완료일시
                      </div>
                      <div className="font-medium">
                        {formatDateTime(transaction.finished)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
