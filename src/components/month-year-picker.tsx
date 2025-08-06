"use client";

import * as React from "react";
import { format, parse, isValid, startOfMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface MonthYearPickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MonthYearPicker({
  date,
  onDateChange,
  placeholder = "MM/YYYY",
  disabled = false,
  className,
}: MonthYearPickerProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [selectedYear, setSelectedYear] = React.useState<string>("");

  // Update input value when date changes
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "MM/yyyy"));
      setSelectedMonth(format(date, "MM"));
      setSelectedYear(format(date, "yyyy"));
    } else {
      setInputValue("");
      setSelectedMonth("");
      setSelectedYear("");
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Try to parse the input as MM/YYYY or MM-YYYY
    if (value) {
      const formats = ["MM/yyyy", "M/yyyy", "MM-yyyy", "M-yyyy"];
      
      for (const formatStr of formats) {
        try {
          const parsedDate = parse(value, formatStr, new Date());
          if (isValid(parsedDate)) {
            const monthStart = startOfMonth(parsedDate);
            onDateChange?.(monthStart);
            return;
          }
        } catch {
          // Continue to next format
        }
      }
    } else {
      onDateChange?.(undefined);
    }
  };

  const handleMonthYearSelect = () => {
    if (selectedMonth && selectedYear) {
      const monthNum = parseInt(selectedMonth, 10);
      const yearNum = parseInt(selectedYear, 10);
      
      if (monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 10) {
        const newDate = new Date(yearNum, monthNum - 1, 1);
        onDateChange?.(newDate);
        setIsOpen(false);
      }
    }
  };

  const months = [
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 11 }, (_, i) => currentYear - i + 10);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-10",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 bg-white" align="start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Month</label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Year</label>
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-48">
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleMonthYearSelect}
                className="w-full"
                disabled={!selectedMonth || !selectedYear}
              >
                Select
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {inputValue && !date && (
        <p className="text-xs text-red-500 mt-1">
          Please enter a valid month/year (MM/YYYY)
        </p>
      )}
    </div>
  );
}