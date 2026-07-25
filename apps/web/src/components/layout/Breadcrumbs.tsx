"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname === "/" ? [] : pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link href="/" className="hover:text-foreground transition-colors flex items-center">
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        const formattedPath = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="text-foreground font-medium" aria-current="page">
                {formattedPath}
              </span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {formattedPath}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
