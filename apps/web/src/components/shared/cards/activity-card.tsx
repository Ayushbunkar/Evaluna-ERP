import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ActivityItem {
	id: string | number;
	title: string;
	description?: string;
	timestamp: Date;
	icon?: React.ReactNode;
	user?: string;
}

interface ActivityCardProps {
	title: string;
	description?: string;
	items: ActivityItem[];
	emptyMessage?: string;
}

export function ActivityCard({
	title,
	description,
	items,
	emptyMessage = "No recent activity.",
}: ActivityCardProps) {
	return (
		<Card className="flex h-full flex-col">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className="flex-1 p-0">
				<ScrollArea className="h-[300px] px-6 pb-6">
					{items.length === 0 ? (
						<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
							{emptyMessage}
						</div>
					) : (
						<div className="space-y-6">
							{items.map((item, index) => (
								<div key={item.id} className="relative flex gap-4">
									{/* Timeline connector */}
									{index !== items.length - 1 && (
										<div className="absolute top-8 left-[15px] h-full w-px bg-border" />
									)}

									<div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
										{item.icon || (
											<div className="h-2 w-2 rounded-full bg-primary" />
										)}
									</div>

									<div className="flex flex-1 flex-col space-y-1 pb-2">
										<div className="flex items-center justify-between gap-2">
											<p className="font-medium text-sm leading-none">
												{item.title}
											</p>
											<span className="whitespace-nowrap text-muted-foreground text-xs">
												{formatDistanceToNow(item.timestamp, {
													addSuffix: true,
												})}
											</span>
										</div>
										{item.description && (
											<p className="text-muted-foreground text-sm">
												{item.description}
											</p>
										)}
										{item.user && (
											<p className="mt-1 font-medium text-primary text-xs">
												{item.user}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
