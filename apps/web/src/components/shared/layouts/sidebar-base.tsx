"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@evaluna/ui/lib/utils";
import { Button } from "@evaluna/ui/components/button";
import { ScrollArea } from "@evaluna/ui/components/scroll-area";
import { ChevronDown, ChevronRight, X, MountainIcon } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface NavigationItem {
  name: string;
  href?: string;
  icon?: React.ElementType;
  items?: NavigationItem[];
}

interface SidebarBaseProps {
  navigation: NavigationItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  roleContext?: string;
}

export function SidebarBase({
  navigation,
  isOpen,
  isCollapsed,
  setIsOpen,
  setIsCollapsed,
  roleContext = "Evaluna",
}: SidebarBaseProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href.endsWith("page.tsx")) return false; // Edge case catch
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MountainIcon className="h-5 w-5 text-primary shrink-0" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-semibold whitespace-nowrap"
            >
              {roleContext}
            </motion.span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => (
            <div key={item.name} className="mb-1">
              {item.items ? (
                // Group
                <>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      expandedGroups.includes(item.name) && "bg-accent/50 text-accent-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />}
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      expandedGroups.includes(item.name) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )
                    )}
                  </button>
                  <AnimatePresence>
                    {!isCollapsed && expandedGroups.includes(item.name) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 space-y-1 pl-9 pr-2">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href || "#"}
                              className={cn(
                                "block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive(subItem.href)
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                // Single Link
                <Link
                  href={item.href || "#"}
                  className={cn(
                    "flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {item.icon && <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) ? "text-primary" : "")} />}
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}