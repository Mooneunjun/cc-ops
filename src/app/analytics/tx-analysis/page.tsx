"use client";

import { useState, useCallback, useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
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
import { TransactionTable } from "@/components/transaction-table";
import { Upload, FileJson, X } from "lucide-react";

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
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          setUploadedData(jsonData);
          setIsUploading(false);

          // sessionStorage에 데이터 저장
          sessionStorage.setItem(
            "analytics-uploaded-data",
            JSON.stringify(jsonData)
          );
          sessionStorage.setItem("analytics-file-name", file.name);
          sessionStorage.setItem("analytics-file-size", file.size.toString());
        } catch (error) {
          console.error("JSON 파싱 오류:", error);
          alert("올바른 JSON 파일이 아닙니다.");
          setIsUploading(false);
          setUploadedFile(null);
        }
      };
      reader.readAsText(file);
    } else {
      alert("JSON 파일만 업로드 가능합니다.");
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

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 pt-0">
            {/* 헤더 */}
            {uploadedData && (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    AML 거래내역 분석
                  </h1>
                  <p className="text-muted-foreground">
                    해외송금 거래내역의 통계를 시각화하고 지표를 검토하세요
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{uploadedFile?.name}</p>
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
                        초기화
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>데이터 초기화 확인</AlertDialogTitle>
                        <AlertDialogDescription>
                          업로드된 거래내역 데이터가 모두 삭제됩니다.
                          계속하시겠습니까?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={clearUploadedFile}>
                          초기화
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* 분석 내용 영역 */}
            {!isDataLoaded ? (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center text-muted-foreground">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm mt-4">데이터를 불러오는 중...</p>
              </div>
            ) : uploadedData ? (
              <TransactionTable data={uploadedData} />
            ) : (
              <div className="w-full">
                {/* 메인 섹션 - 화면 중앙 */}
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center space-y-12 px-4">
                  <div className="space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                      AML 거래내역 분석
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      해외송금 거래내역을 업로드하여{" "}
                      <span className="text-foreground font-medium">
                        통계를 시각화
                      </span>
                      하고 <br />
                      AML 지표를 검토하세요
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="lg" className="gap-2 text-base px-8 py-6">
                          <Upload className="h-5 w-5" />
                          Get Started
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>거래내역 업로드</DialogTitle>
                          <DialogDescription>
                            JSON 형식의 거래내역 파일을 업로드하세요.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {uploadedFile ? (
                            // 업로드된 파일 표시
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileJson className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="text-sm font-medium text-green-900">
                                    {uploadedFile.name}
                                  </p>
                                  <p className="text-xs text-green-600">
                                    {(uploadedFile.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      데이터 초기화 확인
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      업로드된 거래내역 데이터가 모두
                                      삭제됩니다. 계속하시겠습니까?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={clearUploadedFile}
                                    >
                                      초기화
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            // 파일 업로드 영역
                            <div
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              className={`
                            border-2 border-dashed rounded-lg p-8 text-center transition-colors
                            ${
                              isDragOver
                                ? "border-primary bg-primary/5"
                                : "border-gray-300 hover:border-gray-400"
                            }
                          `}
                            >
                              <FileJson className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  JSON 파일을 드래그하여 업로드하세요
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  또는 아래 버튼을 클릭하여 파일을 선택하세요
                                </p>
                              </div>

                              <div className="mt-4">
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
                                    <span>파일 선택</span>
                                  </Button>
                                </label>
                              </div>
                            </div>
                          )}

                          {isUploading && (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <p className="text-sm text-muted-foreground mt-2">
                                파일을 처리하고 있습니다...
                              </p>
                            </div>
                          )}

                          {uploadedData && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                업로드 완료!
                              </p>
                              <div className="text-xs text-muted-foreground">
                                <p>
                                  • {uploadedData.rows?.length || 0}건의
                                  거래내역이 로드되었습니다
                                </p>
                              </div>
                            </div>
                          )}
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
                      JSON 형식의 거래내역 파일을 지원합니다
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
