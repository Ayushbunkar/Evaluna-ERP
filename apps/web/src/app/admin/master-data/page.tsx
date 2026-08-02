"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Boxes, Tag, Scale, Percent, Plus, Search, Edit, Trash2 } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

// Mock Data for fallback
const mockCategories = [
  { id: 1, name: "Electronics", description: "Electronic devices and accessories", status: "active" },
  { id: 2, name: "Furniture", description: "Home and office furniture", status: "active" },
  { id: 3, name: "Clothing", description: "Apparel and garments", status: "inactive" },
];

const mockBrands = [
  { id: 1, name: "Samsung", origin: "South Korea", status: "active" },
  { id: 2, name: "Apple", origin: "USA", status: "active" },
  { id: 3, name: "Nike", origin: "USA", status: "active" },
];

const mockUnits = [
  { id: 1, name: "Kilogram", shortName: "kg", baseUnit: true },
  { id: 2, name: "Piece", shortName: "pcs", baseUnit: true },
  { id: 3, name: "Meter", shortName: "m", baseUnit: true },
];

const mockTaxes = [
  { id: 1, name: "GST 18%", rate: 18, type: "percentage" },
  { id: 2, name: "GST 12%", rate: 12, type: "percentage" },
  { id: 3, name: "GST 5%", rate: 5, type: "percentage" },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage global reference data like categories, brands, units, and tax rates.
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
                      {activeTab === "categories" && <th className="h-10 px-4 text-left font-medium">Description</th>}
                      {activeTab === "brands" && <th className="h-10 px-4 text-left font-medium">Origin</th>}
                      {activeTab === "units" && <th className="h-10 px-4 text-left font-medium">Short Name</th>}
                      {activeTab === "taxes" && <th className="h-10 px-4 text-left font-medium">Rate (%)</th>}
                      <th className="h-10 px-4 text-left font-medium">Status/Info</th>
                      <th className="h-10 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "categories" &&
                      mockCategories.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-muted-foreground">{item.description}</td>
                          <td className="p-4">
                            <Badge variant={item.status === "active" ? "default" : "secondary"}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    {activeTab === "brands" &&
                      mockBrands.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-muted-foreground">{item.origin}</td>
                          <td className="p-4">
                            <Badge variant={item.status === "active" ? "default" : "secondary"}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    {activeTab === "units" &&
                      mockUnits.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-muted-foreground">{item.shortName}</td>
                          <td className="p-4">
                            {item.baseUnit && <Badge variant="outline">Base Unit</Badge>}
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    {activeTab === "taxes" &&
                      mockTaxes.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-muted-foreground">{item.rate}%</td>
                          <td className="p-4">
                            <Badge variant="outline">{item.type}</Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))}
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
