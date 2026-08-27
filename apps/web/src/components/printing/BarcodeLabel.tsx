"use client";

import { Skeleton } from "@evaluna/ui/components/skeleton";
import dynamic from "next/dynamic";
import type React from "react";

const Barcode = dynamic(() => import("react-barcode"), {
	ssr: false,
	loading: () => <Skeleton className="h-[40px] w-full" />,
});

export interface BarcodeLabelProps {
	value: string;
	label?: string;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ value, label }) => {
	return (
		<div className="box-border flex h-[1in] w-[2in] flex-col items-center justify-center overflow-hidden border border-gray-200 bg-white p-2 text-black">
			{label && (
				<div className="mb-1 w-full truncate text-center font-bold text-[10px]">
					{label}
				</div>
			)}
			<Barcode
				value={value}
				width={1.5}
				height={40}
				fontSize={12}
				margin={0}
				displayValue={true}
			/>
		</div>
	);
};

