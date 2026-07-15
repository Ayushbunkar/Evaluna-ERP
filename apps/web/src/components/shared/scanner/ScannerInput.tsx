"use client";

import React, { useRef, useEffect } from "react";

interface ScannerInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onScan: (barcode: string) => void;
}

export function ScannerInput({ onScan, className, ...props }: ScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keep focus on the input if needed for hardware scanner
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        onScan(value);
      }
      e.currentTarget.value = "";
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Scan barcode..."
      onKeyDown={handleKeyDown}
      className={`border rounded p-2 ${className || ''}`}
      autoFocus
      {...props}
    />
  );
}
