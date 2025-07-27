"use client";

import { useState, useCallback, useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransactionTable } from "@/components/transaction/transaction-table";
import { Upload, FileJson, X } from "lucide-react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 클라이언트에서만 sessionStorage 데이터 복원
  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem("analytics-uploaded-data");
      const savedFileName = sessionStorage.getItem("analytics-file-name");
      const savedFileSize = sessionStorage.getItem("analytics-file-size");

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setUploadedData(parsedData);

        // 파일 정보도 복원
        if (savedFileName && savedFileSize) {
          const mockFile = new File([""], savedFileName, {
            type: "application/json",
          });
          Object.defineProperty(mockFile, "size", {
            value: parseInt(savedFileSize),
            writable: false,
          });
          setUploadedFile(mockFile);
        }
      }
    } catch (error) {
      console.error("저장된 데이터 복원 실패:", error);
      // 오류가 있으면 sessionStorage 정리
      sessionStorage.removeItem("analytics-uploaded-data");
      sessionStorage.removeItem("analytics-file-name");
      sessionStorage.removeItem("analytics-file-size");
    }

    setIsDataLoaded(true);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type === "application/json") {
      setUploadedFile(file);
      setIsUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;

        // 기본적인 result 검사
        if (result === null || result === undefined) {
          toast.error("파일을 읽을 수 없습니다.", {
            style: { color: "var(--color-red-400)" },
          });
          setIsUploading(false);
          setUploadedFile(null);
          return;
        }

        // readAsText()를 사용했으므로 string이어야 함
        const content = String(result).trim();

        if (content === "") {
          toast.error("파일이 비어있습니다.", {
            style: { color: "var(--color-red-400)" },
          });
          setIsUploading(false);
          setUploadedFile(null);
          return;
        }

        try {
          // JSON 파싱 시도
          const jsonData = JSON.parse(content);

          // 기본적인 데이터 검증 (null 체크만)
          if (jsonData === null) {
            toast.error("JSON 데이터가 유효하지 않습니다.", {
              style: { color: "var(--color-red-400)" },
            });
            setIsUploading(false);
            setUploadedFile(null);
            return;
          }

          setUploadedData(jsonData);
          setIsUploading(false);

          // sessionStorage에 데이터 저장
          sessionStorage.setItem(
            "analytics-uploaded-data",
            JSON.stringify(jsonData)
          );
          sessionStorage.setItem("analytics-file-name", file.name);
          sessionStorage.setItem("analytics-file-size", file.size.toString());

          // Toast로 성공 피드백
          toast.success(
            `${
              jsonData.rows?.length || 0
            }건의 거래내역이 성공적으로 로드되었습니다!`
          );
        } catch (error) {
          console.error("JSON 파싱 오류:", error);
          toast.error("올바른 JSON 파일이 아닙니다.", {
            style: { color: "var(--color-red-400)" },
          });
          setIsUploading(false);
          setUploadedFile(null);
        }
      };

      reader.onerror = () => {
        console.error("파일 읽기 오류:", reader.error);
        toast.error("파일을 읽는 중 오류가 발생했습니다.", {
          style: { color: "var(--color-red-400)" },
        });
        setIsUploading(false);
        setUploadedFile(null);
      };

      reader.readAsText(file);
    } else {
      toast.error("JSON 파일만 업로드 가능합니다.", {
        style: { color: "var(--color-red-400)" },
      });
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedData(null);

    // sessionStorage에서도 데이터 제거
    sessionStorage.removeItem("analytics-uploaded-data");
    sessionStorage.removeItem("analytics-file-name");
    sessionStorage.removeItem("analytics-file-size");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-[calc(100dvh-1rem)] flex flex-col">
        <ProtectedRoute>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Analytics</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>TX Analysis</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto mb-4">
            <div className="flex flex-col gap-4 p-4 pt-0 h-full">
              {/* 헤더 */}
              {uploadedData && (
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Transaction Analysis
                    </h1>
                    <p className="text-muted-foreground">
                      Analyze transaction data and visualize statistics.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {uploadedFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedData.rows?.length || 0}건의 거래내역
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reset
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirm Data Reset
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            All uploaded transaction data will be deleted.
                            Continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={clearUploadedFile}>
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {/* 분석 내용 영역 */}
              {!isDataLoaded ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm mt-4">데이터를 불러오는 중...</p>
                </div>
              ) : uploadedData ? (
                <TransactionTable data={uploadedData} />
              ) : (
                <div className="w-full h-full">
                  {/* 메인 섹션 - 화면 중앙 */}
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-12 px-4">
                    <div className="space-y-6">
                      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        Transaction Analysis
                      </h1>
                      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Upload transaction data and visualize statistics.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="lg"
                            className="gap-2 text-base px-8 py-6"
                          >
                            <Upload className="h-5 w-5" />
                            Get Started
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Upload Transaction Data</DialogTitle>
                            <DialogDescription>
                              Upload a JSON file of transaction data.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* 파일 업로드 영역 */}
                            <div
                              onDrop={!isUploading ? handleDrop : undefined}
                              onDragOver={
                                !isUploading ? handleDragOver : undefined
                              }
                              onDragLeave={
                                !isUploading ? handleDragLeave : undefined
                              }
                              className={`
                            border-2 border-dashed rounded-lg p-8 text-center transition-colors h-[240px] flex flex-col items-center justify-center
                            ${
                              isUploading
                                ? "border-primary bg-primary/5"
                                : isDragOver
                                ? "border-primary bg-primary/5"
                                : "border-gray-300 hover:border-gray-400"
                            }
                          `}
                            >
                              {isUploading ? (
                                // 로딩 상태
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                  <div className="space-y-1 text-center">
                                    <p className="text-sm font-medium">
                                      Processing file...
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Please wait while we process your JSON
                                      file.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                // 업로드 상태
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                  <FileJson className="h-12 w-12 text-gray-400" />
                                  <div className="space-y-1 text-center">
                                    <p className="text-sm font-medium">
                                      Drag and drop a JSON file to upload.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Or click the button below to select a
                                      file.
                                    </p>
                                  </div>
                                  <div>
                                    <input
                                      type="file"
                                      accept=".json"
                                      onChange={handleFileInput}
                                      className="hidden"
                                      id="file-upload-main"
                                    />
                                    <label htmlFor="file-upload-main">
                                      <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                        asChild
                                      >
                                        <span>Select File</span>
                                      </Button>
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="lg"
                        className="text-base px-8 py-6"
                      >
                        Learn More
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        JSON format transaction data is supported.
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ProtectedRoute>
      </SidebarInset>
    </SidebarProvider>
  );
}
