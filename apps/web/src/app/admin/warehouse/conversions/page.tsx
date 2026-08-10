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
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import { ArrowRightIcon, BoxesIcon, BoxIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function WarehouseConversionsPage() {
	const utils = trpc.useUtils();
	const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
	const [quantity, setQuantity] = useState<number | "">("");

	const { data: convertibleProducts, isLoading: isLoadingProducts } =
		trpc.inventory.getConvertibleProducts.useQuery({});
	const { data: history, isLoading: isLoadingHistory } =
		trpc.inventory.getConversions.useQuery({});

	const unpackMutation = trpc.inventory.convertPackToLoose.useMutation({
		onSuccess: () => {
			toast.success("Successfully unpacked items");
			utils.inventory.getConversions.invalidate();
			(utils.inventory as any).getInventory?.invalidate();
			setQuantity("");
		},
		onError: (error) => toast.error(error.message),
	});

	const packMutation = trpc.inventory.convertLooseToPack.useMutation({
		onSuccess: () => {
			toast.success("Successfully packed items");
			utils.inventory.getConversions.invalidate();
			(utils.inventory as any).getInventory?.invalidate();
			setQuantity("");
		},
		onError: (error) => toast.error(error.message),
	});

	const activeProduct = convertibleProducts?.find(
		(p) => p.id.toString() === selectedProduct,
	);

	const yieldAmount = activeProduct
		? Number(quantity) * ((activeProduct as any).units_per_pack || 1)
		: 0;

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
					<BoxesIcon className="h-6 w-6 text-foreground" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Unit Conversions
					</h1>
					<p className="text-muted-foreground text-sm">
						Manage pack-to-loose and loose-to-pack conversions.
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Conversion Tool</CardTitle>
						<CardDescription>
							Select an item and how many units you want to convert.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="unpack" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="unpack">Unpack (Pack → Loose)</TabsTrigger>
								<TabsTrigger value="pack">Pack (Loose → Pack)</TabsTrigger>
							</TabsList>
							<div className="mt-6 space-y-4">
								<div className="space-y-2">
									<label className="font-medium text-sm">Product</label>
									{isLoadingProducts ? (
										<Skeleton className="h-10 w-full" />
									) : (
										<select
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											value={selectedProduct || ""}
											onChange={(e) => setSelectedProduct(e.target.value)}
										>
											<option value="" disabled>
												Select a pack product...
											</option>
											{convertibleProducts?.map((p) => (
												<option key={p.id} value={p.id}>
													{p.name} ({(p as any).units_per_pack} units/pack)
												</option>
											))}
										</select>
									)}
								</div>

								<div className="space-y-2">
									<label className="font-medium text-sm">
										Quantity of Packs to Convert
									</label>
									<Input
										type="number"
										min="1"
										placeholder="e.g. 5"
										value={quantity}
										onChange={(e) =>
											setQuantity(
												e.target.value === "" ? "" : Number(e.target.value),
											)
										}
									/>
								</div>

								{activeProduct && quantity && quantity > 0 && (
									<div className="rounded-lg border bg-muted/30 p-4">
										<p className="font-medium text-sm">Conversion Preview</p>
										<div className="mt-2 flex items-center justify-between text-muted-foreground text-sm">
											<div className="text-center">
												<span className="block font-bold text-foreground text-lg">
													{quantity}
												</span>
												<span className="line-clamp-1">
													{activeProduct.name}
												</span>
											</div>
											<ArrowRightIcon className="mx-2 h-5 w-5 flex-shrink-0" />
											<div className="text-center">
												<span className="block font-bold text-foreground text-lg">
													{yieldAmount}
												</span>
												<span className="line-clamp-1">
													{(activeProduct as any).loose_product_id ||
														"Loose Items"}
												</span>
											</div>
										</div>
									</div>
								)}

								<TabsContent value="unpack" className="mt-4">
									<Button
										className="w-full"
										disabled={
											!activeProduct || !quantity || unpackMutation.isPending
										}
										onClick={() =>
											unpackMutation.mutate({
												packProductId: activeProduct!.id,
												packsToConvert: Number(quantity),
												branchId: 1, // Defaulting to 1 for demo if no branch selector exists
											})
										}
									>
										{unpackMutation.isPending ? (
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<BoxIcon className="mr-2 h-4 w-4" />
										)}
										Unpack Items
									</Button>
								</TabsContent>

								<TabsContent value="pack" className="mt-4">
									<Button
										className="w-full"
										disabled={
											!activeProduct || !quantity || packMutation.isPending
										}
										onClick={() =>
											packMutation.mutate({
												packProductId: activeProduct!.id,
												packsToCreate: Number(quantity),
												branchId: 1, // Defaulting to 1 for demo
											})
										}
									>
										{packMutation.isPending ? (
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<BoxesIcon className="mr-2 h-4 w-4" />
										)}
										Pack Items
									</Button>
								</TabsContent>
							</div>
						</Tabs>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Conversion History</CardTitle>
						<CardDescription>
							Recent packing and unpacking events.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingHistory ? (
							<div className="space-y-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						) : history?.length === 0 ? (
							<div className="py-8 text-center text-muted-foreground">
								No conversions recorded yet.
							</div>
						) : (
							<div className="space-y-4">
								{history?.map((entry) => (
									<div
										key={entry.id}
										className="flex items-center justify-between rounded-lg border p-3 text-sm"
									>
										<div>
											<p className="font-medium">
												{entry.packsConverted > 0
													? `Unpacked ${entry.packsConverted} x ${entry.packProductName}`
													: `Packed ${Math.abs(entry.packsConverted)} x ${entry.packProductName}`}
											</p>
											<p className="text-muted-foreground text-xs">
												{entry.packsConverted > 0 ? "+" : "-"}
												{Math.abs(entry.looseYielded)} {entry.looseProductName}
											</p>
										</div>
										<div className="text-right text-muted-foreground text-xs">
											<p>{new Date(entry.createdAt).toLocaleDateString()}</p>
											<p>{entry.convertedBy}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
