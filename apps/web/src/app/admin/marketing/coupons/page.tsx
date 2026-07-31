"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Edit, Plus, Ticket } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function CouponsManager() {
	const [isOpen, setIsOpen] = useState(false);
	const [editingCoupon, setEditingCoupon] = useState<any>(null);

	const utils = trpc.useUtils();
	const { data: coupons, isLoading } = trpc.marketing.listCoupons.useQuery();

	const createMutation = trpc.marketing.createCoupon.useMutation({
		onSuccess: () => {
			utils.marketing.listCoupons.invalidate();
			setIsOpen(false);
			resetForm();
		},
	});

	const updateMutation = trpc.marketing.updateCoupon.useMutation({
		onSuccess: () => {
			utils.marketing.listCoupons.invalidate();
			setIsOpen(false);
			resetForm();
		},
	});

	const [formData, setFormData] = useState({
		code: "",
		discount_type: "percentage" as "percentage" | "flat",
		discount_value: "",
		min_order_value: "",
		usage_limit: "",
		valid_until: "",
		is_active: true,
	});

	const resetForm = () => {
		setEditingCoupon(null);
		setFormData({
			code: "",
			discount_type: "percentage",
			discount_value: "",
			min_order_value: "",
			usage_limit: "",
			valid_until: "",
			is_active: true,
		});
	};

	const handleEdit = (coupon: any) => {
		setEditingCoupon(coupon);
		setFormData({
			code: coupon.code,
			discount_type: coupon.discount_type,
			discount_value: coupon.discount_value,
			min_order_value: coupon.min_order_value || "",
			usage_limit: coupon.usage_limit || "",
			valid_until: coupon.valid_until
				? new Date(coupon.valid_until).toISOString().split("T")[0]
				: "",
			is_active: coupon.is_active,
		});
		setIsOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const payload = {
			code: formData.code,
			discount_type: formData.discount_type,
			discount_value: Number(formData.discount_value),
			min_order_value: formData.min_order_value
				? Number(formData.min_order_value)
				: undefined,
			usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
			valid_until: formData.valid_until || null,
			is_active: formData.is_active,
		};

		if (editingCoupon) {
			updateMutation.mutate({ id: editingCoupon.id, ...payload });
		} else {
			createMutation.mutate(payload);
		}
	};

	return (
		<PageTransition className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Coupons</h1>
					<p className="mt-1 text-muted-foreground">
						Manage discount codes and promotional offers.
					</p>
				</div>
				<Dialog
					open={isOpen}
					onOpenChange={(open) => {
						setIsOpen(open);
						if (!open) resetForm();
					}}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" /> Create Coupon
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{editingCoupon ? "Edit Coupon" : "Create New Coupon"}
							</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4 pt-4">
							<div className="space-y-2">
								<Label htmlFor="code">Coupon Code</Label>
								<Input
									id="code"
									value={formData.code}
									onChange={(e) =>
										setFormData({
											...formData,
											code: e.target.value.toUpperCase(),
										})
									}
									required
									placeholder="e.g. SUMMER20"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Discount Type</Label>
									<Select
										value={formData.discount_type}
										onValueChange={(v: "percentage" | "flat") =>
											setFormData({ ...formData, discount_type: v })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="percentage">Percentage (%)</SelectItem>
											<SelectItem value="flat">Flat Amount</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="discount_value">Value</Label>
									<Input
										id="discount_value"
										type="number"
										value={formData.discount_value}
										onChange={(e) =>
											setFormData({
												...formData,
												discount_value: e.target.value,
											})
										}
										required
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="min_order">Min Order Value (Optional)</Label>
									<Input
										id="min_order"
										type="number"
										value={formData.min_order_value}
										onChange={(e) =>
											setFormData({
												...formData,
												min_order_value: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
									<Input
										id="usage_limit"
										type="number"
										value={formData.usage_limit}
										onChange={(e) =>
											setFormData({ ...formData, usage_limit: e.target.value })
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="valid_until">Valid Until (Optional)</Label>
								<Input
									id="valid_until"
									type="date"
									value={formData.valid_until}
									onChange={(e) =>
										setFormData({ ...formData, valid_until: e.target.value })
									}
								/>
							</div>
							<div className="flex items-center space-x-2 pt-2">
								<Switch
									id="active"
									checked={formData.is_active}
									onCheckedChange={(c) =>
										setFormData({ ...formData, is_active: c })
									}
								/>
								<Label htmlFor="active">Active</Label>
							</div>
							<div className="flex justify-end pt-4">
								<Button
									type="submit"
									disabled={
										createMutation.isPending || updateMutation.isPending
									}
								>
									{editingCoupon ? "Save Changes" : "Create Coupon"}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Ticket className="h-5 w-5" /> All Coupons
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Value</TableHead>
								<TableHead>Min Order</TableHead>
								<TableHead>Usage</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="py-8 text-center text-muted-foreground"
									>
										Loading coupons...
									</TableCell>
								</TableRow>
							) : coupons?.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="py-8 text-center text-muted-foreground"
									>
										No coupons found. Create one to get started.
									</TableCell>
								</TableRow>
							) : (
								coupons?.map((coupon) => (
									<TableRow key={coupon.id}>
										<TableCell className="font-medium">{coupon.code}</TableCell>
										<TableCell className="capitalize">
											{coupon.discount_type}
										</TableCell>
										<TableCell>
											{coupon.discount_type === "percentage"
												? `${coupon.discount_value}%`
												: `₹${coupon.discount_value}`}
										</TableCell>
										<TableCell>
											{coupon.min_order_value
												? `₹${coupon.min_order_value}`
												: "-"}
										</TableCell>
										<TableCell>
											{coupon.usage_count || 0}{" "}
											{coupon.usage_limit ? `/ ${coupon.usage_limit}` : ""}
										</TableCell>
										<TableCell>
											<span
												className={`rounded-full px-2 py-1 text-xs ${coupon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
											>
												{coupon.is_active ? "Active" : "Inactive"}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleEdit(coupon)}
											>
												<Edit className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
