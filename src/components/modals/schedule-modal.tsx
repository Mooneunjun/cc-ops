"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { Plus, ChevronDown } from "lucide-react";

// 빈도 옵션
const frequencies = [
  { value: "once", label: "한 번만" },
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
];

// 요일 옵션
const weekdays = [
  { value: "1", label: "월요일" },
  { value: "2", label: "화요일" },
  { value: "3", label: "수요일" },
  { value: "4", label: "목요일" },
  { value: "5", label: "금요일" },
  { value: "6", label: "토요일" },
  { value: "0", label: "일요일" },
];

// 월별 날짜 옵션
const monthlyDays = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}일`,
}));

// 초기 폼 데이터
const initialFormData = {
  title: "",
  frequency: "",
  weekdays: [] as string[],
  dayOfMonth: "",
  time: "",
};

interface ScheduleModalProps {
  children: React.ReactNode;
}

export function ScheduleModal({ children }: ScheduleModalProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeekdayChange = (weekdayValue: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      weekdays: checked
        ? [...prev.weekdays, weekdayValue]
        : prev.weekdays.filter((w) => w !== weekdayValue),
    }));
  };

  const handleFrequencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      frequency: value,
      weekdays: [],
      dayOfMonth: "",
      time: "",
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsScheduleOpen(false);
  };

  const handleSubmit = () => {
    // 폼 검증
    if (!formData.title || !formData.frequency) {
      alert("제목과 주기를 입력해주세요.");
      return;
    }

    if (formData.frequency === "weekly" && formData.weekdays.length === 0) {
      alert("최소 1개 요일을 선택해주세요.");
      return;
    }

    if (formData.frequency === "monthly" && !formData.dayOfMonth) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (!formData.time) {
      alert("시간을 설정해주세요.");
      return;
    }

    console.log("새 스케줄 저장:", formData);
    resetForm();
    setIsDialogOpen(false);
    alert("새 스케줄이 추가되었습니다!");
  };

  const handleCancel = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  // 시간 포맷팅 (24시간 → 12시간)
  const formatTimeDisplay = () => {
    if (!formData.time) return "";

    const [hours, minutes] = formData.time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "오후" : "오전";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${ampm} ${displayHour}:${minutes}`;
  };

  // 요일 표시 텍스트 생성
  const getWeekdaysDisplayText = () => {
    if (formData.weekdays.length === 0) return "";
    if (formData.weekdays.length === 7) return "매일";

    const sortedWeekdays = formData.weekdays
      .map((value) => weekdays.find((w) => w.value === value))
      .filter((w) => w !== undefined)
      .sort((a, b) => {
        const aNum = a!.value === "0" ? 7 : parseInt(a!.value);
        const bNum = b!.value === "0" ? 7 : parseInt(b!.value);
        return aNum - bNum;
      });

    if (sortedWeekdays.length <= 3) {
      return sortedWeekdays.map((w) => w!.label).join(", ");
    }

    const firstTwo = sortedWeekdays
      .slice(0, 2)
      .map((w) => w!.label)
      .join(", ");
    return `${firstTwo} 외 ${sortedWeekdays.length - 2}개`;
  };

  // 스케줄 설명 생성
  const getScheduleDescription = () => {
    if (!formData.frequency) return "";

    let description = "";

    if (formData.frequency === "once") description = "한 번만";
    else if (formData.frequency === "daily") description = "매일";
    else if (formData.frequency === "weekly" && formData.weekdays.length > 0) {
      const weekdaysText = getWeekdaysDisplayText();
      description =
        formData.weekdays.length === 7 ? weekdaysText : `매주 ${weekdaysText}`;
    } else if (formData.frequency === "monthly" && formData.dayOfMonth) {
      description = `매월 ${formData.dayOfMonth}일`;
    }

    if (formData.time) description += ` ${formatTimeDisplay()}`;
    return description;
  };

  // 스케줄 완료 체크 (자동 접기 제거)
  const checkScheduleComplete = () => {
    const isComplete =
      formData.frequency &&
      formData.time &&
      (formData.frequency === "once" ||
        formData.frequency === "daily" ||
        (formData.frequency === "weekly" && formData.weekdays.length > 0) ||
        (formData.frequency === "monthly" && formData.dayOfMonth));

    // 자동 닫기 로직 제거 - 사용자가 직접 제어하도록 함
    // if (isComplete && isScheduleOpen) {
    //   setTimeout(() => setIsScheduleOpen(false), 500);
    // }

    return isComplete;
  };

  useEffect(() => {
    checkScheduleComplete();
  }, [formData, isScheduleOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="sr-only">새 스케줄 추가</DialogTitle>
        <div className="space-y-6">
          {/* 제목 입력 */}
          <Input
            placeholder="스케줄 제목을 입력하세요"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="border-0 shadow-none text-lg font-medium placeholder:text-muted-foreground focus-visible:ring-0 px-0"
          />

          {/* 스케줄 설정 드롭다운 카드 */}
          <Popover open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <PopoverTrigger asChild>
              <div className="w-full p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {getScheduleDescription() ? (
                      <p className="text-sm font-medium">
                        {getScheduleDescription()}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        스케줄을 설정하세요
                      </p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </PopoverTrigger>

            <PopoverContent className="w-[400px] p-4 space-y-6" align="start">
              {/* 주기 선택 */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">주기</Label>
                <div className="w-32">
                  <Select
                    value={formData.frequency}
                    onValueChange={handleFrequencyChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="주기 선택" />
                    </SelectTrigger>
                    <SelectContent
                      style={{ minWidth: "128px", width: "128px !important" }}
                    >
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 매주 선택시 - 요일 토글 버튼들 */}
              {formData.frequency === "weekly" && (
                <div className="flex justify-between">
                  {weekdays.map((weekday) => (
                    <Button
                      key={weekday.value}
                      type="button"
                      variant={
                        formData.weekdays.includes(weekday.value)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="w-9 h-9 rounded-full p-0 text-sm"
                      onClick={() =>
                        handleWeekdayChange(
                          weekday.value,
                          !formData.weekdays.includes(weekday.value)
                        )
                      }
                    >
                      {weekday.label.substring(0, 1)}
                    </Button>
                  ))}
                </div>
              )}

              {/* 매월 선택시 - 날짜 선택기 */}
              {formData.frequency === "monthly" && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">날짜</Label>
                  <div className="w-32">
                    <Select
                      value={formData.dayOfMonth}
                      onValueChange={(value) =>
                        handleInputChange("dayOfMonth", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="날짜 선택" />
                      </SelectTrigger>
                      <SelectContent
                        style={{ minWidth: "128px", width: "128px !important" }}
                      >
                        {monthlyDays.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 시간 설정 - 항상 표시 */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">시간</Label>
                <div className="w-32">
                  <TimePicker
                    date={
                      formData.time
                        ? (() => {
                            const [hours, minutes] = formData.time.split(":");
                            const date = new Date();
                            date.setHours(
                              parseInt(hours),
                              parseInt(minutes),
                              0,
                              0
                            );
                            return date;
                          })()
                        : undefined
                    }
                    setDate={(date) => {
                      if (date) {
                        const hours = date
                          .getHours()
                          .toString()
                          .padStart(2, "0");
                        const minutes = date
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");
                        handleInputChange("time", `${hours}:${minutes}`);
                      }
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
