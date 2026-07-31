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
			<label className="relative inline-flex cursor-pointer select-none items-center">
				<input
					type="checkbox"
					checked={checked}
					onChange={handleChange}
					className="peer sr-only"
					ref={ref}
					{...props}
				/>
				<div
					className={cn(
						"peer h-5 w-9 rounded-full bg-muted peer-focus:ring-2 peer-focus:ring-ring/25",
						"after:absolute after:top-[2px] after:left-[2px] after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white",
						"after:h-4 after:w-4 after:rounded-full after:border after:border-border after:bg-background after:transition-all dark:border-gray-600",
						"peer-checked:bg-primary",
						className,
					)}
				/>
			</label>
		);
	},
);

Switch.displayName = "Switch";

export { Switch };
