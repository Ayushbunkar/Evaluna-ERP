import React from 'react';
import Barcode from 'react-barcode';

export interface BarcodeLabelProps {
  value: string;
  label?: string;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ value, label }) => {
  return (
    <div className="w-[2in] h-[1in] bg-white text-black p-2 flex flex-col items-center justify-center border border-gray-200 overflow-hidden box-border">
      {label && <div className="text-[10px] font-bold mb-1 truncate w-full text-center">{label}</div>}
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
