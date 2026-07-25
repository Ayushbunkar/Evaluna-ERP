"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Package } from "lucide-react";

export default function MovementPage() {
  const t = useTranslations("warehouse.movement");
  const [sourceId, setSourceId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  const { data: locations } = trpc.warehouse.listLocations.useQuery();
  const { data: products } = trpc.products.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const activeLocations = locations?.filter(l => l.is_active) || [];

  const moveStockMutation = trpc.warehouse.moveStock.useMutation({
    onSuccess: () => {
      toast.success(t("moveSuccess"));
      setSourceId("");
      setDestinationId("");
      setProductId("");
      setQuantity("");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destinationId || !productId || !quantity) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (sourceId === destinationId) {
      toast.error(t("sameLocationError"));
      return;
    }

    moveStockMutation.mutate({
      source_location_id: sourceId,
      destination_location_id: destinationId,
      product_id: productId,
      quantity: Number(quantity),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center space-x-4 mb-8">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("moveStock")}</CardTitle>
          <CardDescription>{t("moveStockDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMove} className="space-y-6">
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
              <div className="space-y-2">
                <Label>{t("sourceLocation")}</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectSource")} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pb-2">
                <ArrowRight className="text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label>{t("destinationLocation")}</Label>
                <Select value={destinationId} onValueChange={setDestinationId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectDestination")} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("product")}</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectProduct")} />
                </SelectTrigger>
                <SelectContent>
                  {products?.items?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("quantity")}</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t("quantityPlaceholder")}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={moveStockMutation.isPending}
            >
              {moveStockMutation.isPending ? t("moving") : t("moveButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
