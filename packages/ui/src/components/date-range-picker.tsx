"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@evaluna/ui/lib/utils"

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: {
  className?: string
  date: { from: Date; to: Date }
  onDateChange: (date: { from: Date; to: Date }) => void
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm text-muted-foreground">Start Date</label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={date.from.toISOString().split('T')[0]}
            onChange={(e) => onDateChange({...date, from: new Date(e.target.value)})}
            className="w-full pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm text-muted-foreground">End Date</label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={date.to.toISOString().split('T')[0]}
            onChange={(e) => onDateChange({...date, to: new Date(e.target.value)})}
            className="w-full pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
