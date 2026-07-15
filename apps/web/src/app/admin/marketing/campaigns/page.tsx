"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageTransition, AnimatedCard } from "@/lib/animations";
import { Rocket, Plus, Users } from "lucide-react";
import { toast } from "sonner";

export default function CampaignsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "discount",
    targetSegment: "All",
    couponId: "none",
    channel: "Email",
    messageTemplate: ""
  });
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.marketing.listCampaigns.useQuery();
  const { data: coupons } = trpc.marketing.listCoupons.useQuery();

  const estimateMutation = trpc.marketing.estimateAudience.useMutation({
    onSuccess: (data: any) => {
      setAudienceCount(data.count);
    },
    onError: () => {
      toast.error("Failed to estimate audience");
    }
  });

  const createMutation = trpc.marketing.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully");
      setIsDialogOpen(false);
      utils.marketing.listCampaigns.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const launchMutation = trpc.marketing.launchCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign launched!");
      utils.marketing.listCampaigns.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Launch failed: ${error.message}`);
    }
  });

  const handleEstimate = () => {
    estimateMutation.mutate({ targetSegment: formData.targetSegment });
  };

  const handleSave = () => {
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      targetSegment: formData.targetSegment,
      couponId: formData.couponId !== "none" ? Number(formData.couponId) : undefined,
      channel: formData.channel,
      messageTemplate: formData.messageTemplate
    });
  };

  return (
    <PageTransition className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage marketing campaigns and messaging.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Sale 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Target Segment (Tier)</label>
                  <Select value={formData.targetSegment} onValueChange={(v) => setFormData({ ...formData, targetSegment: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Tiers</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium">Audience Size</label>
                  <Button variant="outline" size="sm" onClick={handleEstimate} disabled={estimateMutation.isPending}>
                    <Users className="w-3 h-3 mr-2" /> 
                    {estimateMutation.isPending ? "Estimating..." : "Estimate"}
                  </Button>
                </div>
                {audienceCount !== null && (
                  <div className="text-sm text-green-600 font-medium">
                    Estimated reach: {audienceCount} customers
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Coupon (Optional)</label>
                  <Select value={formData.couponId} onValueChange={(v) => setFormData({ ...formData, couponId: v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {coupons?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Channel</label>
                  <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="In-App">In-App</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Message Template</label>
                <Textarea
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  placeholder="Hi {name}, here is a 20% discount!"
                />
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>Save Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatedCard>
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading campaigns...</TableCell>
                </TableRow>
              ) : campaigns?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No campaigns found.</TableCell>
                </TableRow>
              ) : (
                campaigns?.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="capitalize">{campaign.type}</TableCell>
                    <TableCell>{campaign.targetSegment}</TableCell>
                    <TableCell>{campaign.channel}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.status !== 'active' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => launchMutation.mutate({ id: campaign.id })}
                          disabled={launchMutation.isPending}
                        >
                          <Rocket className="w-4 h-4 mr-1 text-primary" />
                          Launch
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AnimatedCard>
    </PageTransition>
  );
}
