"use client";

import { ReactNode, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
import { Button } from "@evaluna/ui/components/button";
import { isElectron } from "@/lib/electron";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@evaluna/ui/components/dialog";

interface PrintPreviewDialogProps {
  title?: string;
  trigger?: ReactNode;
  children: ReactNode;
  onBeforePrint?: () => Promise<void> | void;
  onAfterPrint?: () => void;
}

export function PrintPreviewDialog({
  title = "Print Preview",
  trigger,
  children,
  onBeforePrint,
  onAfterPrint,
}: PrintPreviewDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    onBeforePrint,
    onAfterPrint,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-muted flex justify-center border rounded-md">
          <div ref={contentRef} className="bg-white text-black print-wrapper">
            {children}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div>
            {isElectron() && (
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-md font-medium border border-green-200">
                Native Print Enabled
              </span>
            )}
          </div>
          <Button onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Confirm Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
