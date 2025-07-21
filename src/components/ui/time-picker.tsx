"use client";

import * as React from "react";
import { Clock, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function TimePicker({ date, setDate, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // 현재 시간 값들
  const currentHour = date ? date.getHours() : 12;
  const currentMinute = date ? date.getMinutes() : 0;

  // 12시간 형식으로 변환
  const display12Hour =
    currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
  const period = currentHour >= 12 ? "오후" : "오전";

  // 시간 표시 포맷
  const timeDisplay = date
    ? `${period} ${display12Hour.toString().padStart(2, "0")}:${currentMinute
        .toString()
        .padStart(2, "0")}`
    : "시간 선택";

  const adjustHour = (increment: number) => {
    const newDate = date ? new Date(date) : new Date();
    let newHour = (currentHour + increment + 24) % 24;
    newDate.setHours(newHour, newDate.getMinutes(), 0, 0);
    setDate(newDate);
  };

  const adjustMinute = (increment: number) => {
    const newDate = date ? new Date(date) : new Date();
    let newMinute = (currentMinute + increment + 60) % 60;
    newDate.setMinutes(newMinute, 0, 0);
    setDate(newDate);
  };

  const handleHourInput = (value: string) => {
    const hour = parseInt(value);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      const newDate = date ? new Date(date) : new Date();
      newDate.setHours(hour, newDate.getMinutes(), 0, 0);
      setDate(newDate);
    }
  };

  const handleMinuteInput = (value: string) => {
    const minute = parseInt(value);
    if (!isNaN(minute) && minute >= 0 && minute <= 59) {
      const newDate = date ? new Date(date) : new Date();
      newDate.setMinutes(minute, 0, 0);
      setDate(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {timeDisplay}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-4 z-[60]"
        align="start"
        style={{ zIndex: 60 }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold">
              {period} {display12Hour.toString().padStart(2, "0")}:
              {currentMinute.toString().padStart(2, "0")}
            </div>
          </div>

          {/* 시간 조절 */}
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-sm font-medium mb-3">시간</div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustHour(-1)}
                  className="h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={currentHour.toString().padStart(2, "0")}
                  onChange={(e) => handleHourInput(e.target.value)}
                  className="w-12 text-center text-lg font-mono font-bold border-0 shadow-none px-0 focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustHour(1)}
                  className="h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* 분 조절 */}
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-sm font-medium mb-3">분</div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustMinute(-5)}
                  className="h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={currentMinute.toString().padStart(2, "0")}
                  onChange={(e) => handleMinuteInput(e.target.value)}
                  className="w-12 text-center text-lg font-mono font-bold border-0 shadow-none px-0 focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustMinute(5)}
                  className="h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
