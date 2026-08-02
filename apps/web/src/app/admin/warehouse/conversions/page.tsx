import { WarehouseIcon } from "lucide-react";

export default function WarehouseConversionsPage() {
	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
					<WarehouseIcon className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Unit Conversions</h1>
					<p className="text-muted-foreground text-sm">
						Manage pack-to-loose and loose-to-pack conversions.
					</p>
				</div>
			</div>
			<div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
				<div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
					<WarehouseIcon className="h-8 w-8 opacity-50" />
					<p>This module is under construction.</p>
				</div>
			</div>
		</div>
	);
}
