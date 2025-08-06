"use client";

import * as React from "react";
import { format, parse, isValid, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/enhanced-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Range = { from?: Date; to?: Date };

type CommonProps = {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  allowFuture?: boolean; // default true (applies to date and month-year)
};

type DateModeProps = CommonProps & {
  mode: "date";
  value?: Date;
  onChange?: (d: Date | undefined) => void;
};

type RangeModeProps = CommonProps & {
  mode: "range";
  value?: Range;
  onChange?: (r: Range) => void;
};

type MonthYearModeProps = CommonProps & {
  mode: "month-year";
  value?: Date; // normalized to first of month
  onChange?: (d: Date | undefined) => void;
  minYear?: number; // default 1950
  maxYear?: number; // default currentYear + 10
  showClear?: boolean; // default true
};

type UnifiedDatePickerProps =
  | DateModeProps
  | RangeModeProps
  | MonthYearModeProps;

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function clampFuture(d: Date, allowFuture: boolean | undefined) {
  if (allowFuture !== false) return true;
  const now = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return a <= b;
}

// ---- date helpers ----
function tryParseDateMDY(s: string): Date | undefined {
  const formats = [
    "MM/dd/yyyy",
    "M/d/yyyy",
    "MM-d-yyyy",
    "M-d-yyyy",
    "MM-dd-yyyy",
  ];
  for (const f of formats) {
    const d = parse(s, f, new Date());
    if (isValid(d)) return d;
  }
  return undefined;
}

function tryParseMonthYear(s: string): Date | undefined {
  const trimmed = s.trim();
  if (!/^\d{1,2}[\/-]\d{4}$/.test(trimmed)) return undefined;
  const normalized = trimmed.replace("-", "/");
  const parsed = parse(normalized, "M/yyyy", new Date());
  return isValid(parsed) ? startOfMonth(parsed) : undefined;
}

// ============================================================================

export default function UnifiedDatePicker(props: UnifiedDatePickerProps) {
  if (props.mode === "date") return <DateMode {...props} />;
  if (props.mode === "range") return <RangeMode {...props} />;
  return <MonthYearMode {...props} />;
}

// ===== Date Mode =================================================================

function DateMode({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  disabled,
  className,
  minDate,
  maxDate,
  allowFuture,
}: DateModeProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, "MM/dd/yyyy"));
      setShowError(false);
    } else {
      setInputValue("");
      setShowError(false);
    }
  }, [value]);

  const withinBounds = (d: Date) => {
    if (minDate && d < minDate) return false;
    if (maxDate && d > maxDate) return false;
    if (!clampFuture(d, allowFuture)) return false;
    return true;
  };

  const commit = (d?: Date) => {
    if (d && !withinBounds(d)) {
      setShowError(true);
      return;
    }
    onChange?.(d);
    setShowError(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d/-]/g, "");
    setInputValue(v);
    setShowError(false);
  };

  const handleBlur = () => {
    if (!inputValue) {
      commit(undefined);
      return;
    }
    const d = tryParseDateMDY(inputValue);
    if (d && withinBounds(d)) {
      setInputValue(format(d, "MM/dd/yyyy"));
      commit(d);
    } else {
      setShowError(true);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pr-10", disabled && "cursor-not-allowed opacity-50")}
          aria-invalid={showError}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2"
              disabled={disabled}
              aria-label="Open calendar"
            >
              <CalendarIcon className="h-4 w-4 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(d) => {
                commit(d);
                setIsOpen(false);
              }}
              disabled={(d) =>
                (minDate && d < minDate) ||
                (maxDate && d > maxDate) ||
                !clampFuture(d, allowFuture)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {showError && (
        <p className="text-xs text-red-500 mt-1">
          Enter a valid date
          {minDate ? ` ≥ ${format(minDate, "MM/dd/yyyy")}` : ""}
          {maxDate ? ` and ≤ ${format(maxDate, "MM/dd/yyyy")}` : ""}
          {allowFuture === false ? ", future dates not allowed" : ""}.
        </p>
      )}
    </div>
  );
}

// ===== Range Mode ===============================================================

function RangeMode({
  value,
  onChange,
  placeholder = "Pick date range",
  disabled,
  className,
  minDate,
  maxDate,
}: RangeModeProps) {
  const [open, setOpen] = React.useState(false);
  const fmt = (d?: Date) => (d ? format(d, "LLL dd, y") : "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value?.to ? (
              <>
                {fmt(value.from)} – {fmt(value.to)}
              </>
            ) : (
              fmt(value.from)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={{ from: value?.from, to: value?.to }}
          onSelect={(range) => {
            const r = range || { from: undefined, to: undefined };
            onChange?.(r);
            if (r.from && r.to) setOpen(false);
          }}
          numberOfMonths={2}
          disabled={(d) => Boolean((minDate && d < minDate) || (maxDate && d > maxDate))}
          className="bg-white"
        />
      </PopoverContent>
    </Popover>
  );
}

// ===== Month-Year Mode ==========================================================

function MonthYearMode({
  value,
  onChange,
  placeholder = "MM/YYYY",
  disabled,
  className,
  minYear = 1950,
  maxYear,
  allowFuture = true,
  showClear = true,
}: MonthYearModeProps) {
  const now = React.useMemo(() => new Date(), []);
  const computedMaxYear = maxYear ?? now.getFullYear() + 10;

  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      const d = startOfMonth(value);
      setInputValue(format(d, "MM/yyyy"));
      setSelectedMonth(format(d, "MM"));
      setSelectedYear(format(d, "yyyy"));
      setShowError(false);
    } else {
      setInputValue("");
      setSelectedMonth("");
      setSelectedYear("");
      setShowError(false);
    }
  }, [value]);

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = computedMaxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [computedMaxYear, minYear]);

  const withinBounds = (d: Date) => {
    const y = d.getFullYear();
    if (y < minYear || y > computedMaxYear) return false;
    if (!clampFuture(d, allowFuture)) return false;
    return true;
  };

  const commit = (d?: Date) => {
    if (d && !withinBounds(d)) {
      setShowError(true);
      return;
    }
    onChange?.(d);
    setShowError(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d/-]/g, "");
    setInputValue(v);
    setShowError(false);
  };

  const handleBlur = () => {
    if (!inputValue) {
      commit(undefined);
      return;
    }
    const d = tryParseMonthYear(inputValue);
    if (d && withinBounds(d)) {
      setInputValue(format(d, "MM/yyyy"));
      setSelectedMonth(format(d, "MM"));
      setSelectedYear(format(d, "yyyy"));
      commit(d);
    } else {
      setShowError(true);
    }
  };

  const handleSelect = () => {
    if (!selectedMonth || !selectedYear) return;
    const y = parseInt(selectedYear, 10);
    const m = parseInt(selectedMonth, 10) - 1;
    const d = startOfMonth(new Date(y, m, 1));
    if (withinBounds(d)) {
      setInputValue(format(d, "MM/yyyy"));
      commit(d);
      setIsOpen(false);
    } else {
      setShowError(true);
    }
  };

  const clear = () => {
    setInputValue("");
    setSelectedMonth("");
    setSelectedYear("");
    setShowError(false);
    onChange?.(undefined);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          pattern="\d{1,2}[/-]\d{4}"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn("pr-20", disabled && "cursor-not-allowed opacity-50")}
          aria-invalid={showError}
        />

        <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1">
          {showClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={clear}
              disabled={disabled || (!inputValue && !value)}
              aria-label="Clear date"
            >
              <XIcon className="h-4 w-4 text-gray-500" />
            </Button>
          )}

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
                aria-label="Open month and year picker"
              >
                <CalendarIcon className="h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 bg-white" align="start">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="month-select"
                      className="text-sm font-medium mb-1 block"
                    >
                      Month
                    </label>
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger
                        id="month-select"
                        className="w-full bg-white"
                      >
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="year-select"
                      className="text-sm font-medium mb-1 block"
                    >
                      Year
                    </label>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger
                        id="year-select"
                        className="w-full bg-white"
                      >
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-56">
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleSelect}
                  className="w-full"
                  disabled={!selectedMonth || !selectedYear}
                >
                  Select
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showError && (
        <p className="text-xs text-red-500 mt-1">
          Enter a valid month/year between {minYear} and {computedMaxYear}
          {allowFuture === false ? ", future months not allowed" : ""}.
        </p>
      )}
    </div>
  );
}
