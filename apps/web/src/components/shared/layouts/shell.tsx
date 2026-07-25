"use client";

import { cn } from "@evaluna/ui/lib/utils";
import { useState } from "react";
import { HeaderBase } from "./header-base";
import { SidebarBase, type NavigationItem } from "./sidebar-base";

interface ShellProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  title?: string;
  roleContext?: string;
}

/**
 * Shared Application Shell
 * Provides the responsive grid layout, sidebar state management, and mobile drawer.
 */
export function Shell({ children, navigation, title = "Evaluna ERP", roleContext }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SidebarBase
        navigation={navigation}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsOpen={setSidebarOpen}
        setIsCollapsed={setSidebarCollapsed}
        roleContext={roleContext}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderBase
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/20">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}