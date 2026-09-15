import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const alertVariants = cva(
	"relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
	{
		variants: {
			variant: {
				default: "bg-background text-foreground border-slate-200 dark:border-slate-800",
				destructive:
					"border-rose-500/50 text-rose-600 dark:border-rose-500 [&>svg]:text-rose-600 bg-rose-50/50 dark:bg-rose-950/20",
				warning:
					"border-amber-500/50 text-amber-600 dark:border-amber-500 [&>svg]:text-amber-600 bg-amber-50/50 dark:bg-amber-950/20",
				success:
					"border-emerald-500/50 text-emerald-600 dark:border-emerald-500 [&>svg]:text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

const Alert = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
	<div
		ref={ref}
		role="alert"
		className={cn(alertVariants({ variant }), className)}
		{...props}
	/>
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h5
		ref={ref}
		className={cn("mb-1 font-semibold leading-none tracking-tight text-sm", className)}
		{...props}
	/>
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("text-xs [&_p]:leading-relaxed text-slate-600 dark:text-slate-400", className)}
		{...props}
	/>
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
