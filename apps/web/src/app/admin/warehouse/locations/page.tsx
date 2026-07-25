"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@evaluna/ui/components/data-table";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@evaluna/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Label } from "@evaluna/ui/components/label";
import { Plus, Edit, Printer } from "lucide-react";
import Barcode from "react-barcode";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

type Location = {
  id: string;
  name: string;
  location_type: string;
  section: string | null;
  aisle: string | null;
  shelf: string | null;
  level: string | null;
  capacity: number | null;
  current_stock: number | null;
  is_active: boolean;
};

export default function LocationsPage() {
  const t = useTranslations("warehouse.locations");
  const utils = trpc.useUtils();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [printLocation, setPrintLocation] = useState<Location | null>(null);

  const { data: locations, isLoading } = trpc.warehouse.listLocations.useQuery();

  const createMutation = trpc.warehouse.createLocation.useMutation({
    onSuccess: () => {
      toast.success(t("createSuccess"));
      utils.warehouse.listLocations.invalidate();
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.warehouse.updateLocation.useMutation({
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      utils.warehouse.listLocations.invalidate();
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      location_type: formData.get("location_type") as string,
      section: formData.get("section") as string || null,
      aisle: formData.get("aisle") as string || null,
      shelf: formData.get("shelf") as string || null,
      level: formData.get("level") as string || null,
      capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: ColumnDef<Location>[] = [
    { accessorKey: "name", header: t("name") },
    { accessorKey: "location_type", header: t("location_type") },
    { accessorKey: "section", header: t("section") },
    { accessorKey: "aisle", header: t("aisle") },
    { accessorKey: "shelf", header: t("shelf") },
    { accessorKey: "level", header: t("level") },
    { accessorKey: "capacity", header: t("capacity") },
    { accessorKey: "current_stock", header: t("current_stock") },
    {
      id: "actions",
      cell: ({ row }) => {
        const location = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditingLocation(location);
                setIsFormOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPrintLocation(location)}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <Button onClick={() => {
          setEditingLocation(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={locations ?? []}
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? t("editLocation") : t("addLocation")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingLocation?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_type">{t("location_type")}</Label>
              <Select name="location_type" defaultValue={editingLocation?.location_type || "storage"}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">{t("storage")}</SelectItem>
                  <SelectItem value="picking">{t("picking")}</SelectItem>
                  <SelectItem value="quarantine">{t("quarantine")}</SelectItem>
                  <SelectItem value="damage">{t("damage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">{t("section")}</Label>
                <Input id="section" name="section" defaultValue={editingLocation?.section || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aisle">{t("aisle")}</Label>
                <Input id="aisle" name="aisle" defaultValue={editingLocation?.aisle || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf">{t("shelf")}</Label>
                <Input id="shelf" name="shelf" defaultValue={editingLocation?.shelf || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{t("level")}</Label>
                <Input id="level" name="level" defaultValue={editingLocation?.level || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">{t("capacity")}</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="0"
                defaultValue={editingLocation?.capacity || ""}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!printLocation} onOpenChange={(open) => !open && setPrintLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("printBarcode")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="flex items-center justify-center">
              {printLocation && (
                <Barcode value={printLocation.name || printLocation.id} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{printLocation?.id}</p>
            <Button
              className="w-full mt-4"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              {t("print")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
