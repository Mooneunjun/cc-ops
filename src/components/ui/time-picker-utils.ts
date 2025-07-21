import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * regular expression to check for valid hour format (01-23)
 */
export function isValidHour(value: string) {
  return /^([01]?[0-9]|2[0-3])$/.test(value);
}

/**
 * regular expression to check for valid 12 hour format (01-12)
 */
export function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value);
}

/**
 * regular expression to check for valid minute format (00-59)
 */
export function isValidMinute(value: string) {
  return /^[0-5]?[0-9]$/.test(value);
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

export function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: GetValidNumberConfig
) {
  let numericValue = parseInt(value, 10);

  if (!isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, "0");
  }

  return "00";
}

export function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

export function getValid12Hour(value: string) {
  if (isValid12Hour(value)) return value;
  return getValidNumber(value, { max: 12, min: 1 });
}

export function getValidMinute(value: string) {
  if (isValidMinute(value)) return value;
  return getValidNumber(value, { max: 59 });
}

export type TimePickerType = "minutes" | "hours" | "seconds" | "12hours";

export function setMinutes(date: Date, value: string) {
  const minutes = getValidMinute(value);
  date.setMinutes(parseInt(minutes, 10));
  return date;
}

export function setHours(date: Date, value: string) {
  const hours = getValidHour(value);
  date.setHours(parseInt(hours, 10));
  return date;
}

export function set12Hours(date: Date, value: string, period: string) {
  const hours = parseInt(getValid12Hour(value), 10);
  const convertedHours = convert12HourTo24Hour(hours, period as "AM" | "PM");
  date.setHours(convertedHours);
  return date;
}

export function setSeconds(date: Date, value: string) {
  const seconds = getValidNumber(value, { max: 59 });
  date.setSeconds(parseInt(seconds, 10));
  return date;
}

export function convert12HourTo24Hour(hour: number, period: "AM" | "PM") {
  if (period === "AM") {
    if (hour === 12) {
      return 0;
    }
    return hour;
  } else {
    if (hour === 12) {
      return 12;
    }
    return hour + 12;
  }
}

export function convert24HourTo12Hour(hour: number): {
  hour: number;
  period: "AM" | "PM";
} {
  if (hour === 0) {
    return { hour: 12, period: "AM" };
  } else if (hour < 12) {
    return { hour, period: "AM" };
  } else if (hour === 12) {
    return { hour: 12, period: "PM" };
  } else {
    return { hour: hour - 12, period: "PM" };
  }
}

export function display12HourValue(hour: number) {
  if (hour === 0 || hour === 12) return "12";
  if (hour < 12) return hour.toString();
  return (hour - 12).toString();
}
