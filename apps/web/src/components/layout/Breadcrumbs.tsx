"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export function Breadcrumbs() {
	const pathname = usePathname();
	const paths = pathname === "/" ? [] : pathname.split("/").filter(Boolean);

	if (paths.length === 0) return null;

	return (
		<nav
			aria-label="Breadcrumb"
			className="mb-4 flex items-center space-x-1 text-muted-foreground text-sm"
		>
			<Link
				href="/"
				className="flex items-center transition-colors hover:text-foreground"
			>
				<Home className="h-4 w-4" />
				<span className="sr-only">Home</span>
			</Link>
			{paths.map((path, index) => {
				const href = `/${paths.slice(0, index + 1).join("/")}`;
				const isLast = index === paths.length - 1;
				const formattedPath =
					path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

				return (
					<React.Fragment key={path}>
						<ChevronRight className="h-4 w-4" />
						{isLast ? (
							<span className="font-medium text-foreground" aria-current="page">
								{formattedPath}
							</span>
						) : (
							<Link
								href={href}
								className="transition-colors hover:text-foreground"
							>
								{formattedPath}
							</Link>
						)}
					</React.Fragment>
				);
			})}
		</nav>
	);
}

