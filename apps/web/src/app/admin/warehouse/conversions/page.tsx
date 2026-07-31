"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { PackageOpenIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
// Try to import useBranch, fallback to mock if not found
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

export default function ConversionsPage() {
	const trpc = useTRPC();
	const { data: products = [], isLoading: productsLoading } =
		trpc.products.list.useQuery();

	let branchId = 1;
	try {
		const branchContext = useBranch();
		if (branchContext?.branch?.id) {
			branchId = branchContext.branch.id;
		}
	} catch (_e) {
		// fallback
	}

	const [selectedPackId, setSelectedPackId] = useState<string>("");
	const [packsToConvert, setPacksToConvert] = useState<number>(1);

	const packProducts = products.filter((p) => p.is_pack);

	const convertMutation = trpc.inventory.convertPackToLoose.useMutation({
		onSuccess: () => {
			toast.success("Successfully converted packs to loose products");
			setSelectedPackId("");
			setPacksToConvert(1);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to convert packs");
		},
	});

	const handleConvert = () => {
		if (!selectedPackId) {
			toast.error("Please select a pack product");
			return;
		}

		convertMutation.mutate({
			packProductId: Number.parseInt(selectedPackId, 10),
			packsToConvert,
			branchId,
		});
	};

	return (
		<PageTransition>
			<div className="mx-auto max-w-2xl space-y-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Conversions</h1>
					<p className="text-muted-foreground">
						Convert pack products into loose products for inventory.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PackageOpenIcon className="h-5 w-5" />
							Pack to Loose Conversion
						</CardTitle>
						<CardDescription>
							Open a pack to increase the inventory of its associated loose
							product.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="pack_product">Pack Product</Label>
							<Select
								value={selectedPackId}
								onValueChange={setSelectedPackId}
								disabled={productsLoading}
							>
								<SelectTrigger id="pack_product">
									<SelectValue placeholder="Select a pack product" />
								</SelectTrigger>
								<SelectContent>
									{packProducts.map((p) => (
										<SelectItem key={p.id} value={p.id.toString()}>
											{p.name}{" "}
											{p.units_per_pack ? `(${p.units_per_pack} units)` : ""}
										</SelectItem>
									))}
									{packProducts.length === 0 && !productsLoading && (
										<SelectItem value="none" disabled>
											No pack products available
										</SelectItem>
									)}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="packs_to_convert">Number of Packs to Open</Label>
							<Input
								id="packs_to_convert"
								type="number"
								min={1}
								value={packsToConvert}
								onChange={(e) =>
									setPacksToConvert(Number.parseInt(e.target.value, 10) || 0)
								}
							/>
						</div>

						<Button
							onClick={handleConvert}
							disabled={
								!selectedPackId ||
								packsToConvert < 1 ||
								convertMutation.isPending
							}
							className="w-full"
						>
							{convertMutation.isPending ? "Converting..." : "Convert"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
