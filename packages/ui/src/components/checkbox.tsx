import { cn } from "@evaluna/ui/lib/utils";
import * as React from "react";

export interface CheckboxProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	onCheckedChange?: (checked: boolean) => void;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, onChange, onCheckedChange, ...props }, ref) => {
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
			onCheckedChange?.(e.target.checked);
		};

		return (
			<input
				type="checkbox"
				className={cn(
					"h-4 w-4 cursor-pointer rounded border border-primary text-primary focus:ring-primary accent-emerald-600",
					className,
				)}
				ref={ref}
				onChange={handleChange}
				{...props}
			/>
		);
	},
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
