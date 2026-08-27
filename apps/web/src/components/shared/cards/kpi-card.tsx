import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { cn } from "@evaluna/ui/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface KpiCardProps {
	title: string;
	value: string | number;
	icon: React.ElementType;
	trend?: number; // percentage change
	trendLabel?: string;
	description?: string;
}

export function KpiCard({
	title,
	value,
	icon: Icon,
	trend,
	trendLabel,
	description,
}: KpiCardProps) {
	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
				<div className="rounded-lg bg-primary/10 p-2">
					<Icon className="h-4 w-4 text-primary" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{value}</div>

				{trend !== undefined ? (
					<div className="mt-1 flex items-center gap-1">
						<span
							className={cn(
								"flex items-center font-medium text-xs",
								trend > 0
									? "text-emerald-500"
									: trend < 0
										? "text-rose-500"
										: "text-muted-foreground",
							)}
						>
							{trend > 0 ? (
								<ArrowUp className="mr-0.5 h-3 w-3" />
							) : trend < 0 ? (
								<ArrowDown className="mr-0.5 h-3 w-3" />
							) : null}
							{Math.abs(trend)}%
						</span>
						{trendLabel && (
							<span className="text-muted-foreground text-xs">
								{trendLabel}
							</span>
						)}
					</div>
				) : description ? (
					<p className="mt-1 text-muted-foreground text-xs">{description}</p>
				) : null}
			</CardContent>
		</Card>
	);
}

