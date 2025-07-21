import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import {
  TimePickerType,
  getValidHour,
  getValid12Hour,
  getValidMinute,
  setHours,
  set12Hours,
  setMinutes,
} from "./time-picker-utils";

interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date?: Date;
  setDate: (date: Date | undefined) => void;
  period?: string;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerInput = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>(
  (
    {
      className,
      type = "tel",
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      setDate,
      onChange,
      onKeyDown,
      picker,
      period,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref
  ) => {
    const [flag, setFlag] = React.useState<boolean>(false);
    const [prevInternal, setPrevInternal] = React.useState<string>("");

    /**
     * allow the user to enter the next field with ArrowRight
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
      onKeyDown?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === "tel") {
        const isValid = isValidInputValue(e.target.value, picker);
        if (!isValid) {
          e.target.value = date ? getDateByType(date, picker) : "";
        }
      }
    };

    const isValidInputValue = (
      value: string,
      type: TimePickerType
    ): boolean => {
      const numericValue = parseInt(value, 10);
      switch (type) {
        case "hours":
          return (
            !isNaN(numericValue) && numericValue >= 0 && numericValue <= 23
          );
        case "minutes":
          return (
            !isNaN(numericValue) && numericValue >= 0 && numericValue <= 59
          );
        case "12hours":
          return (
            !isNaN(numericValue) && numericValue >= 1 && numericValue <= 12
          );
        default:
          return false;
      }
    };

    const getDateByType = (date: Date, type: TimePickerType): string => {
      switch (type) {
        case "hours":
          return getValidHour(date.getHours().toString());
        case "minutes":
          return getValidMinute(date.getMinutes().toString());
        case "12hours":
          return getValid12Hour((date.getHours() % 12 || 12).toString());
        default:
          return "00";
      }
    };

    const getArrowByType = (type: TimePickerType) => {
      switch (type) {
        case "hours":
          return { up: () => addHour(), down: () => subtractHour() };
        case "minutes":
          return { up: () => addMinute(), down: () => subtractMinute() };
        case "12hours":
          return {
            up: () => add12Hour(),
            down: () => subtract12Hour(),
          };
        default:
          return { up: () => {}, down: () => {} };
      }
    };

    const addHour = () => {
      if (date) {
        const newDate = new Date(date);
        newDate.setHours((newDate.getHours() + 1) % 24);
        setDate(newDate);
      }
    };

    const subtractHour = () => {
      if (date) {
        const newDate = new Date(date);
        newDate.setHours((newDate.getHours() - 1 + 24) % 24);
        setDate(newDate);
      }
    };

    const addMinute = () => {
      if (date) {
        const newDate = new Date(date);
        newDate.setMinutes((newDate.getMinutes() + 1) % 60);
        setDate(newDate);
      }
    };

    const subtractMinute = () => {
      if (date) {
        const newDate = new Date(date);
        newDate.setMinutes((newDate.getMinutes() - 1 + 60) % 60);
        setDate(newDate);
      }
    };

    const add12Hour = () => {
      if (date) {
        const newDate = new Date(date);
        const currentHour = newDate.getHours() % 12 || 12;
        const nextHour = (currentHour % 12) + 1;
        const is24Hour = newDate.getHours() >= 12;
        newDate.setHours(is24Hour ? nextHour + 11 : nextHour - 1);
        setDate(newDate);
      }
    };

    const subtract12Hour = () => {
      if (date) {
        const newDate = new Date(date);
        const currentHour = newDate.getHours() % 12 || 12;
        const prevHour = currentHour === 1 ? 12 : currentHour - 1;
        const is24Hour = newDate.getHours() >= 12;
        newDate.setHours(is24Hour ? prevHour + 11 : prevHour - 1);
        setDate(newDate);
      }
    };

    React.useEffect(() => {
      if (date && !flag) {
        const internalValue = getDateByType(date, picker);
        if (internalValue !== prevInternal && !flag) {
          setFlag(true);
          (ref as React.MutableRefObject<HTMLInputElement>).current.value =
            internalValue;
          setPrevInternal(internalValue);
          setFlag(false);
        }
      }
    }, [date, flag, picker, prevInternal, ref]);

    return (
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          "w-[48px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        value={value || (date ? getDateByType(date, picker) : "")}
        onChange={(e) => {
          e.preventDefault();
          const input = e.target.value;
          const newDate = date ? new Date(date) : new Date();
          if (picker === "hours") {
            setDate(setHours(newDate, input));
          } else if (picker === "minutes") {
            setDate(setMinutes(newDate, input));
          } else if (picker === "12hours") {
            setDate(set12Hours(newDate, input, period || "AM"));
          }
          onChange?.(e);
        }}
        type={type}
        inputMode="numeric"
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            getArrowByType(picker).up();
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            getArrowByType(picker).down();
          }
          handleKeyDown(e);
        }}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

TimePickerInput.displayName = "TimePickerInput";

export { TimePickerInput };
