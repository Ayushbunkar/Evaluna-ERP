"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "w-9 h-5 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-ring/25",
          "peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
          "after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600",
          "peer-checked:bg-primary",
          className
        )} />
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
