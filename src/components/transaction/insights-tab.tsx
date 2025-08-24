"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";
import { MonthlyYearlyPivot } from "./monthly-yearly-pivot";
import { RecipientPivot } from "./recipient-pivot";

interface InsightsTabProps {
  filteredData: any[];
}

export function InsightsTab({ filteredData }: InsightsTabProps) {
  const monthlyTableRef = useRef<HTMLDivElement>(null);
  const recipientTableRef = useRef<HTMLDivElement>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleTableSelection = (tableId: string, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => [...prev, tableId]);
    } else {
      setSelectedTables(prev => prev.filter(id => id !== tableId));
    }
  };

  const downloadScreenshot = async () => {
    if (selectedTables.length === 0) return;
    
    setIsDownloading(true);
    
    // UI가 업데이트될 수 있도록 짧은 지연 추가
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      // modern-screenshot 라이브러리 사용 - 최신 CSS 지원
      const { domToPng } = await import('modern-screenshot');
      
      if (selectedTables.length === 1) {
        // 하나만 선택된 경우 - 개별 다운로드
        const tableId = selectedTables[0];
        let element: HTMLDivElement | null = null;
        let filename = '';
        
        if (tableId === 'monthly' && monthlyTableRef.current) {
          element = monthlyTableRef.current;
          filename = '전체_송금량_표.png';
        } else if (tableId === 'recipient' && recipientTableRef.current) {
          element = recipientTableRef.current;
          filename = '수취인별_송금량_표.png';
        }
        
        if (element) {
          const dataUrl = await domToPng(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            debug: false,
          });
          
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // 여러 개 선택된 경우 - 기존 DOM을 직접 사용
        const elements: HTMLDivElement[] = [];
        
        // 선택된 테이블 순서대로 수집
        selectedTables.forEach(tableId => {
          if (tableId === 'monthly' && monthlyTableRef.current) {
            elements.push(monthlyTableRef.current);
          } else if (tableId === 'recipient' && recipientTableRef.current) {
            elements.push(recipientTableRef.current);
          }
        });
        
        if (elements.length > 0) {
          // 각 테이블을 개별적으로 캡처한 후 합치기
          const canvases: HTMLCanvasElement[] = [];
          
          for (const element of elements) {
            const dataUrl = await domToPng(element, {
              scale: 2,
              backgroundColor: '#ffffff',
              debug: false,
            });
            
            // 각 스크린샷 사이에 짧은 지연 추가 (UI 반응성 향상)
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // dataUrl을 canvas로 변환
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = dataUrl;
            });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvases.push(canvas);
            }
          }
          
          // 캔버스들을 세로로 합치기
          if (canvases.length > 0) {
            const totalWidth = Math.max(...canvases.map(c => c.width));
            const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + (canvases.length - 1) * 48; // 24px * 2 (scale)
            
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            finalCanvas.width = totalWidth;
            finalCanvas.height = totalHeight;
            
            if (finalCtx) {
              // 흰색 배경
              finalCtx.fillStyle = '#ffffff';
              finalCtx.fillRect(0, 0, totalWidth, totalHeight);
              
              // 캔버스들을 세로로 배치
              let yOffset = 0;
              canvases.forEach((canvas, index) => {
                finalCtx.drawImage(canvas, 0, yOffset);
                yOffset += canvas.height + (index < canvases.length - 1 ? 48 : 0); // 간격 추가
              });
              
              // 최종 이미지 다운로드
              finalCanvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  
                  // 파일명 결정
                  let filename = '';
                  if (selectedTables.includes('monthly') && selectedTables.includes('recipient')) {
                    filename = 'TX_Analysis_전체표.png';
                  } else {
                    filename = 'TX_Analysis_선택된표.png';
                  }
                  
                  link.download = filename;
                  link.href = url;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }, 'image/png', 1.0);
            }
          }
        }
      }
    } catch (error) {
      console.error('스크린샷 다운로드 실패:', error);
      alert(`스크린샷 다운로드 중 오류가 발생했습니다: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 다운로드 컨트롤 */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
        <div className="flex items-center space-x-6">
          <h3 className="text-sm font-medium text-muted-foreground">표 스크린샷 다운로드</h3>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="monthly-table"
                checked={selectedTables.includes('monthly')}
                onCheckedChange={(checked) => handleTableSelection('monthly', checked === true)}
              />
              <label htmlFor="monthly-table" className="text-sm cursor-pointer">
                전체 송금량
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recipient-table"
                checked={selectedTables.includes('recipient')}
                onCheckedChange={(checked) => handleTableSelection('recipient', checked === true)}
              />
              <label htmlFor="recipient-table" className="text-sm cursor-pointer">
                수취인별 송금량
              </label>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={downloadScreenshot}
          disabled={selectedTables.length === 0 || isDownloading}
          className="min-w-[120px]"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              다운로드 중...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              다운받기
            </>
          )}
        </Button>
      </div>
      
      {/* 테이블들 */}
      <div className="space-y-4">
        <div ref={monthlyTableRef}>
          <MonthlyYearlyPivot filteredData={filteredData} />
        </div>
        <div ref={recipientTableRef}>
          <RecipientPivot filteredData={filteredData} />
        </div>
      </div>
    </div>
  );
}
