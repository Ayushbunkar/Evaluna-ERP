"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface BranchContextType {
  activeBranchId: number | null; // null = all branches (superadmin view)
  setActiveBranchId: (id: number | null) => void;
}

const BranchContext = createContext<BranchContextType>({
  activeBranchId: null,
  setActiveBranchId: () => {},
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);

  // Persist branch selection in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("activeBranchId");
    if (saved && saved !== "null") {
      setActiveBranchId(parseInt(saved, 10));
    }
  }, []);

  const handleSetBranch = (id: number | null) => {
    setActiveBranchId(id);
    localStorage.setItem("activeBranchId", String(id));
  };

  return (
    <BranchContext.Provider value={{ activeBranchId, setActiveBranchId: handleSetBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
