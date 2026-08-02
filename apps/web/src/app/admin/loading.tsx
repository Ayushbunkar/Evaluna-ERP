import { Loader2Icon } from "lucide-react";

export default function AdminLoading() {
	return (
		<div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-4">
			<Loader2Icon className="h-10 w-10 animate-spin text-primary opacity-50" />
			<div className="flex flex-col items-center gap-1">
				<p className="font-medium text-lg tracking-tight">Loading...</p>
				<p className="text-muted-foreground text-sm">
					Please wait while we fetch the latest data.
				</p>
			</div>
		</div>
	);
}
