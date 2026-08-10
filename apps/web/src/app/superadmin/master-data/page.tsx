"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Boxes,
	Edit,
	Percent,
	Plus,
	Scale,
	Search,
	Tag,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

// Fetch real data from backend
const { data: categories, isLoading: categoriesLoading } =
	useTRPC().masterData.getCategories.useQuery();
const { data: brands, isLoading: brandsLoading } =
	useTRPC().masterData.getBrands.useQuery();
const { data: units, isLoading: unitsLoading } =
	useTRPC().masterData.getUnits.useQuery();
const { data: taxes, isLoading: taxesLoading } =
	useTRPC().masterData.getTaxes.useQuery();

// Show loading state while data is being fetched
const isLoading =
	categoriesLoading || brandsLoading || unitsLoading || taxesLoading;

// Transform data for display
const displayCategories =
	categories?.map((cat) => ({
		id: cat.id,
		name: cat.name,
		description: cat.description,
		status: cat.status,
	})) || [];

const displayBrands =
	brands?.map((brand) => ({
		id: brand.id,
		name: brand.name,
		origin: brand.origin,
		status: brand.status,
	})) || [];

const displayUnits =
	units?.map((unit) => ({
		id: unit.id,
		name: unit.name,
		shortName: unit.shortName,
		baseUnit: unit.baseUnit,
	})) || [];

const displayTaxes =
	taxes?.map((tax) => ({
		id: tax.id,
		name: tax.name,
		rate: tax.rate,
		type: tax.type,
	})) || [];

export default function MasterDataPage() {
	const [activeTab, setActiveTab] = useState("categories");

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Master Data Management
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage global reference data like categories, brands, units, and tax
						rates.
					</p>
				</div>
			</div>

			<div className="flex gap-6">
				{/* Sidebar */}
				<div className="w-64 space-y-2">
					<Button
						variant={activeTab === "categories" ? "default" : "ghost"}
						className="w-full justify-start"
						onClick={() => setActiveTab("categories")}
					>
						<Boxes className="mr-2 h-4 w-4" /> Categories
					</Button>
					<Button
						variant={activeTab === "brands" ? "default" : "ghost"}
						className="w-full justify-start"
						onClick={() => setActiveTab("brands")}
					>
						<Tag className="mr-2 h-4 w-4" /> Brands
					</Button>
					<Button
						variant={activeTab === "units" ? "default" : "ghost"}
						className="w-full justify-start"
						onClick={() => setActiveTab("units")}
					>
						<Scale className="mr-2 h-4 w-4" /> Units of Measure
					</Button>
					<Button
						variant={activeTab === "taxes" ? "default" : "ghost"}
						className="w-full justify-start"
						onClick={() => setActiveTab("taxes")}
					>
						<Percent className="mr-2 h-4 w-4" /> Tax Rates
					</Button>
				</div>

				{/* Content Area */}
				<div className="flex-1">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="capitalize">{activeTab} List</CardTitle>
							<div className="flex space-x-2">
								<Button variant="outline" size="icon">
									<Search className="h-4 w-4" />
								</Button>
								<Button>
									<Plus className="mr-2 h-4 w-4" /> Add New
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50">
											<th className="h-10 px-4 text-left font-medium">Name</th>
											{activeTab === "categories" && (
												<th className="h-10 px-4 text-left font-medium">
													Description
												</th>
											)}
											{activeTab === "brands" && (
												<th className="h-10 px-4 text-left font-medium">
													Origin
												</th>
											)}
											{activeTab === "units" && (
												<th className="h-10 px-4 text-left font-medium">
													Short Name
												</th>
											)}
											{activeTab === "taxes" && (
												<th className="h-10 px-4 text-left font-medium">
													Rate (%)
												</th>
											)}
											<th className="h-10 px-4 text-left font-medium">
												Status/Info
											</th>
											<th className="h-10 px-4 text-right font-medium">
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{isLoading ? (
											<tr>
												<td colSpan={4} className="p-8 text-center">
													<div className="flex flex-col items-center gap-4">
														<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
														<span className="text-muted-foreground">
															Loading data...
														</span>
													</div>
												</td>
											</tr>
										) : activeTab === "categories" ? (
											displayCategories.length > 0 ? (
												displayCategories.map((item) => (
													<tr
														key={item.id}
														className="border-b last:border-0 hover:bg-muted/50"
													>
														<td className="p-4 font-medium">{item.name}</td>
														<td className="p-4 text-muted-foreground">
															{item.description}
														</td>
														<td className="p-4">
															<Badge
																variant={
																	item.status === "active"
																		? "default"
																		: "secondary"
																}
															>
																{item.status}
															</Badge>
														</td>
														<td className="p-4 text-right">
															<Button variant="ghost" size="icon">
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={4} className="p-8 text-center">
														<div className="flex flex-col items-center gap-2">
															<Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
															<span className="text-muted-foreground">
																No categories found
															</span>
															<Button size="sm" className="mt-2">
																<Plus className="mr-2 h-4 w-4" /> Add Category
															</Button>
														</div>
													</td>
												</tr>
											)
										) : activeTab === "brands" ? (
											displayBrands.length > 0 ? (
												displayBrands.map((item) => (
													<tr
														key={item.id}
														className="border-b last:border-0 hover:bg-muted/50"
													>
														<td className="p-4 font-medium">{item.name}</td>
														<td className="p-4 text-muted-foreground">
															{item.origin}
														</td>
														<td className="p-4">
															<Badge
																variant={
																	item.status === "active"
																		? "default"
																		: "secondary"
																}
															>
																{item.status}
															</Badge>
														</td>
														<td className="p-4 text-right">
															<Button variant="ghost" size="icon">
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={4} className="p-8 text-center">
														<div className="flex flex-col items-center gap-2">
															<Tag className="mx-auto h-8 w-8 text-muted-foreground" />
															<span className="text-muted-foreground">
																No brands found
															</span>
															<Button size="sm" className="mt-2">
																<Plus className="mr-2 h-4 w-4" /> Add Brand
															</Button>
														</div>
													</td>
												</tr>
											)
										) : activeTab === "units" ? (
											displayUnits.length > 0 ? (
												displayUnits.map((item) => (
													<tr
														key={item.id}
														className="border-b last:border-0 hover:bg-muted/50"
													>
														<td className="p-4 font-medium">{item.name}</td>
														<td className="p-4 text-muted-foreground">
															{item.shortName}
														</td>
														<td className="p-4">
															{item.baseUnit && (
																<Badge variant="outline">Base Unit</Badge>
															)}
														</td>
														<td className="p-4 text-right">
															<Button variant="ghost" size="icon">
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={4} className="p-8 text-center">
														<div className="flex flex-col items-center gap-2">
															<Scale className="mx-auto h-8 w-8 text-muted-foreground" />
															<span className="text-muted-foreground">
																No units found
															</span>
															<Button size="sm" className="mt-2">
																<Plus className="mr-2 h-4 w-4" /> Add Unit
															</Button>
														</div>
													</td>
												</tr>
											)
										) : displayTaxes.length > 0 ? (
											displayTaxes.map((item) => (
												<tr
													key={item.id}
													className="border-b last:border-0 hover:bg-muted/50"
												>
													<td className="p-4 font-medium">{item.name}</td>
													<td className="p-4 text-muted-foreground">
														{item.rate}%
													</td>
													<td className="p-4">
														<Badge variant="outline">{item.type}</Badge>
													</td>
													<td className="p-4 text-right">
														<Button variant="ghost" size="icon">
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="text-destructive"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={4} className="p-8 text-center">
													<div className="flex flex-col items-center gap-2">
														<Percent className="mx-auto h-8 w-8 text-muted-foreground" />
														<span className="text-muted-foreground">
															No tax rates found
														</span>
														<Button size="sm" className="mt-2">
															<Plus className="mr-2 h-4 w-4" /> Add Tax Rate
														</Button>
													</div>
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
