"use client";

import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { DatePickerWithRange } from "@evaluna/ui/components/date-range-picker";
import { Download, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PackerReportsPage() {
  const t = useTranslations("nav");
  const [timeRange, setTimeRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("summary");

  // Fetch report data
  const { data: reportData, isLoading } = useTRPC().packer.getReports.useQuery({
    startDate: timeRange.from,
    endDate: timeRange.to,
    reportType,
  });

  // Transform backend data to match our component structure
  const transformedData = reportData ? {
    totalOrders: reportData.totalOrders,
    avgPackingTime: reportData.avgPackingTime,
    period: reportData.period,
    errorRate: reportData.errorRate,
    totalItems: reportData.totalItems,
    itemsTrend: reportData.itemsTrend,
    accuracy: reportData.accuracy,
    accuracyTrend: reportData.accuracyTrend,
    totalErrors: reportData.totalErrors,
    errorsTrend: reportData.errorsTrend
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{t("Reports")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button size="sm">
            <BarChart2 className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Packing Summary</SelectItem>
                <SelectItem value="efficiency">Packing Efficiency</SelectItem>
                <SelectItem value="errors">Packing Errors</SelectItem>
                <SelectItem value="productivity">Packer Productivity</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={timeRange}
              onDateChange={setTimeRange}
              className="w-full"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transformedData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Cards */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders Packed</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transformedData.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {transformedData.period} period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Packing Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transformedData.avgPackingTime} mins</div>
                    <p className="text-xs text-muted-foreground">
                      Per order
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Placeholder */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Packing Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <BarChart2 className="mx-auto h-12 w-12 mb-2" />
                      <p>Packing Efficiency Chart</p>
                      <p className="text-sm">Orders packed per hour</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="mx-auto h-12 w-12 mb-2" />
                      <p>Packing Error Rate</p>
                      <p className="text-sm">{transformedData.errorRate}% of total orders</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <BarChart2 className="mx-auto h-12 w-12 mb-4" />
                <p>No report data available for selected period</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Metric</th>
                  <th className="text-left p-2 font-medium">Value</th>
                  <th className="text-left p-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-2">Total Items Packed</td>
                  <td className="p-2">{transformedData?.totalItems || 0}</td>
                  <td className="p-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-green-500">+{transformedData?.itemsTrend || 0}%</span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-2">Packing Accuracy</td>
                  <td className="p-2">{transformedData?.accuracy || 0}%</td>
                  <td className="p-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-green-500">+{transformedData?.accuracyTrend || 0}%</span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-2">Errors Detected</td>
                  <td className="p-2">{transformedData?.totalErrors || 0}</td>
                  <td className="p-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-red-500" />
                    <span className="text-red-500">{transformedData?.errorsTrend || 0}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder icons (would normally import from lucide-react)
const Package = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
    <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
    <path d="M21 12H3" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);