"use client";

import { useState } from "react";
import { ClipboardCheckIcon, AlertTriangleIcon, SearchIcon, FileWarningIcon, UserCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { format } from "date-fns";

export default function AuditDashboard() {
  const [activeTab, setActiveTab] = useState("audits");
  
  // Using trpc to fetch active audits and discrepancies
  const { data: audits, isLoading: loadingAudits } = trpc.audit.listAudits.useQuery();
  const { data: discrepancies, isLoading: loadingDiscrepancies } = trpc.audit.listDiscrepancies.useQuery();

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <ClipboardCheckIcon className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <ClipboardCheckIcon className="h-10 w-10 text-emerald-400" />
            Audit & Compliance
          </h1>
          <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
            Manage inventory audits, resolve discrepancies, and write-off damaged or missing stock.
          </p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <Link href="/admin/audit/scanner">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] border-0">
              <UserCheckIcon className="h-5 w-5 mr-2" />
              Auditor Scanner
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800">
            Create Audit Plan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="audits" className="rounded-lg text-base px-6">Active Audits</TabsTrigger>
          <TabsTrigger value="discrepancies" className="rounded-lg text-base px-6">
            Discrepancies & Escalations
            {discrepancies?.filter(d => d.resolution_status === 'pending').length ? (
              <Badge variant="destructive" className="ml-2 animate-pulse">{discrepancies.filter(d => d.resolution_status === 'pending').length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Planned & Ongoing Audits</h2>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search audits..." className="pl-9 w-[300px] bg-white border-slate-200 shadow-sm" />
            </div>
          </div>

          {loadingAudits ? (
            <div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
          ) : audits?.length === 0 ? (
            <Card className="border-dashed bg-slate-50 border-slate-300">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <ClipboardCheckIcon className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No Active Audits</h3>
                <p className="text-slate-500 mt-2 max-w-sm">All inventory checks are complete. Create a new audit plan to start counting.</p>
                <Button className="mt-6 bg-slate-900 text-white">Schedule Audit</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {audits?.map(audit => (
                <Card key={audit.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-emerald-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Audit #{audit.id}</CardTitle>
                        <CardDescription>{format(new Date(audit.created_at!), 'MMM d, yyyy')}</CardDescription>
                      </div>
                      <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'} className={audit.status === 'completed' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}>
                        {audit.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-slate-500">Warehouse</span>
                        <span className="font-medium text-slate-900">Main HQ</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-slate-500">Auditor</span>
                        <span className="font-medium text-slate-900">User ID {audit.auditor_id || 'Unassigned'}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/audit/${audit.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Action Required</h2>
          </div>

          {loadingDiscrepancies ? (
            <div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>
          ) : discrepancies?.length === 0 ? (
            <Card className="border-dashed bg-slate-50 border-slate-300">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileWarningIcon className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">All Clear</h3>
                <p className="text-slate-500 mt-2 max-w-sm">There are no pending discrepancies or missing stock items requiring manager approval.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {discrepancies?.map(disc => (
                <Card key={disc.id} className="border-l-4 border-l-red-500 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-6 flex-1 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                          <h3 className="font-bold text-lg text-slate-900">
                            {disc.type === 'missing' ? 'Missing Stock' : 
                             disc.type === 'damage' ? 'Damaged Product' : 
                             disc.type === 'expiry' ? 'Expired Product' : 'Product Not Available'}
                          </h3>
                        </div>
                        <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 font-bold uppercase text-xs tracking-wider">
                          {disc.resolution_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs uppercase font-semibold mb-1">Item ID</p>
                          <p className="font-medium text-slate-900">{disc.audit_item_id}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase font-semibold mb-1">Discrepancy Qty</p>
                          <p className="font-bold text-red-600">{disc.qty} units</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {disc.notes || "No additional notes provided by the auditor during the count."}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-6 sm:w-48 flex flex-row sm:flex-col justify-center gap-3 border-t sm:border-t-0 sm:border-l">
                      {disc.resolution_status === 'pending' ? (
                        <>
                          <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md">Write Off</Button>
                          <Button variant="outline" className="w-full bg-white text-slate-700 hover:bg-slate-100 border-slate-200">Investigate</Button>
                        </>
                      ) : (
                        <Button variant="ghost" className="w-full text-slate-500" disabled>Resolved</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
