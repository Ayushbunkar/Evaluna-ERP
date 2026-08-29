"use client";

import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import {
  ActivityIcon,
  BanknoteIcon,
  BarcodeIcon,
  ChartLineIcon,
  ClockIcon,
  EditIcon,
  PackageIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function ProductsDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.products.getDashboardStats?.useQuery?.() ?? {};

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Products Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Product catalog, master data, and inventory management
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Product Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/products/new">
              <PackageIcon className="mr-2 h-4 w-4" /> Add New Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StaggerList
        className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
        slow
      >
        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
              onClick={() => (window.location.href = "/products")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <PackageIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Total Products
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.totalProducts || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
              onClick={() => (window.location.href = "/products")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <TrendingUpIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Active Products
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.activeProducts || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
              onClick={() => (window.location.href = "/products/barcodes")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <BarcodeIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Products with Barcodes
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.productsWithBarcodes || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
              onClick={() => (window.location.href = "/products/low-stock")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Low Stock Products
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.lowStockProducts || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Product Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Product Categories
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribution of products by category
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for category distribution */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-border/50 p-4">
                <p className="font-medium text-xs">Electronics</p>
                <p className="font-bold text-xl">45</p>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(125000, locale)} value
                </p>
              </div>
              <div className="border-border/50 p-4">
                <p className="font-medium text-xs">Apparel</p>
                <p className="font-bold text-xl">32</p>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(89000, locale)} value
                </p>
              </div>
              <div className="border-border/50 p-4">
                <p className="font-medium text-xs">Home & Garden</p>
                <p className="font-bold text-xl">28</p>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(67500, locale)} value
                </p>
              </div>
              <div className="border-border/50 p-4">
                <p className="font-medium text-xs">Sports & Outdoors</p>
                <p className="font-bold text-xl">19</p>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(45200, locale)} value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pricing Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Pricing Analysis
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Average prices and margins by category
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for pricing data */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Average Margin</p>
                  <p className="font-bold text-xl">42.5%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↑ 3.2% vs last month
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Avg. Sell Price</p>
                  <p className="font-bold text-xl">
                    {formatCurrency(89.99, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↓ 1.8% vs last month
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Avg. Cost Price</p>
                  <p className="font-bold text-xl">
                    {formatCurrency(51.75, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↑ 0.9% vs last month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Product Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Product Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest product catalog updates
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for recent product activity */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <EditIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Product Price Updated
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Wireless Headphones Pro
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <PackageIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    New Product Added
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Smart Watch Series 5
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Barcode Generated
                  </p>
                  <p className="text-muted-foreground text-xs">
                    12 Products
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}