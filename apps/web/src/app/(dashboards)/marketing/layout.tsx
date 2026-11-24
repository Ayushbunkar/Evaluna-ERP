"use client";

import {
	AtSign,
	BarChart3,
	Bell,
	Bot,
	Calendar,
	FileText,
	FolderHeart,
	Hash,
	Layers,
	LayoutDashboard,
	Megaphone,
	MessageCircle,
	PenSquare,
	Settings,
	ShieldCheck,
} from "lucide-react";
import React from "react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const trpc = useTRPC();
	const notifsQuery = trpc.instagram.getNotifications.useQuery(undefined, {
		refetchInterval: 30000,
		refetchOnWindowFocus: true,
	});

	const unreadNotifs = notifsQuery.data?.unreadCount ?? 0;

	const marketingNavItems: NavItem[] = [
		{ href: "/marketing", labelKey: "Dashboard", icon: LayoutDashboard },
		{ href: "/marketing/accounts", labelKey: "My Accounts", icon: AtSign },
		{ href: "/marketing/posts", labelKey: "All Posts", icon: Layers },
		{ href: "/marketing/planner", labelKey: "Content Planner", icon: Calendar },
		{ href: "/marketing/create", labelKey: "Create Post", icon: PenSquare, badge: "New" },
		{ href: "/marketing/media", labelKey: "Media Library", icon: FolderHeart },
		{ href: "/marketing/campaigns", labelKey: "Campaigns", icon: Megaphone },
		{ href: "/marketing/comments", labelKey: "Comments & Inbox", icon: MessageCircle, badge: "3" },
		{ href: "/marketing/analytics", labelKey: "Analytics", icon: BarChart3 },
		{ href: "/marketing/ai-assistant", labelKey: "AI Assistant", icon: Bot, badge: "AI" },
		{ href: "/marketing/hashtags", labelKey: "Hashtags", icon: Hash },
		{ href: "/marketing/captions", labelKey: "Captions", icon: FileText },
		{
			href: "/marketing/notifications",
			labelKey: "Notifications",
			icon: Bell,
			badge: unreadNotifs > 0 ? unreadNotifs : undefined,
		},
		{ href: "/marketing/team", labelKey: "Team Members", icon: ShieldCheck },
		{ href: "/marketing/settings", labelKey: "Settings", icon: Settings },
	];

	return (
		<AppLayoutWithBranch
			navItems={marketingNavItems}
			namespace="nav"
			role="marketing"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
