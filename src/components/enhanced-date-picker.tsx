"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EnhancedDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  disabled = false,
  className,
}: EnhancedDatePickerProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Update input value when date changes
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "MM/dd/yyyy"));
    } else {
      setInputValue("");
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Try to parse the input as a date
    if (value) {
      // Try multiple date formats
      const formats = ["MM/dd/yyyy", "M/d/yyyy", "MM-dd-yyyy", "M-d-yyyy"];
      
      for (const formatStr of formats) {
        try {
          const parsedDate = parse(value, formatStr, new Date());
          if (isValid(parsedDate)) {
            onDateChange?.(parsedDate);
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

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate);
    setIsOpen(false);
  };

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
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarSelect}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {inputValue && !date && (
        <p className="text-xs text-red-500 mt-1">
          Please enter a valid date (MM/DD/YYYY)
        </p>
      )}
    </div>
  );
}