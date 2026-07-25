"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@evaluna/ui/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@evaluna/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@evaluna/ui/components/select";
import { Search, Plus, Calendar, MapPin, User, FileText } from "lucide-react";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem } from "@/lib/animations";

const mockAudits = [
  {
    id: "AUD-2023-001",
    date: "2023-10-25",
    branch: "Downtown HQ",
    auditor: "Alice Smith",
    status: "Completed",
    discrepancies: 2,
  },
  {
    id: "AUD-2023-002",
    date: "2023-10-26",
    branch: "Westside Branch",
    auditor: "Bob Jones",
    status: "In Progress",
    discrepancies: 0,
  },
  {
    id: "AUD-2023-003",
    date: "2023-10-27",
    branch: "North Warehouse",
    auditor: "Charlie Brown",
    status: "Pending Review",
    discrepancies: 5,
  },
  {
    id: "AUD-2023-004",
    date: "2023-10-28",
    branch: "Eastside Kiosk",
    auditor: "Alice Smith",
    status: "Scheduled",
    discrepancies: 0,
  },
];

export default function AuditsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Completed</Badge>;
      case "In Progress":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">In Progress</Badge>;
      case "Pending Review":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Review</Badge>;
      case "Scheduled":
        return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageTransition>
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Stock Audits</h2>
            <p className="text-muted-foreground mt-1">
              Manage and view all stock audits across locations.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Start New Audit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Start New Audit</DialogTitle>
                <DialogDescription>
                  Create a new stock audit for a specific branch or location.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="branch" className="text-sm font-medium">
                    Branch / Location
                  </label>
                  <Select>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downtown">Downtown HQ</SelectItem>
                      <SelectItem value="westside">Westside Branch</SelectItem>
                      <SelectItem value="north">North Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Audit Type
                  </label>
                  <Select>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Inventory</SelectItem>
                      <SelectItem value="cycle">Cycle Count</SelectItem>
                      <SelectItem value="category">Category Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsDialogOpen(false)}>Create Audit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <AnimatedCard className="bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Audit History</CardTitle>
                <CardDescription>Recent and upcoming audits.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search audits..."
                    className="w-[250px] pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[120px]">Audit ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Discrepancies</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAudits.map((audit) => (
                    <TableRow key={audit.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {audit.id}
                        </div>
                      </TableCell>
                      <TableCell>{audit.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {audit.branch}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {audit.auditor}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell className="text-right">
                        {audit.discrepancies > 0 ? (
                          <span className="text-red-500 font-medium">{audit.discrepancies}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
