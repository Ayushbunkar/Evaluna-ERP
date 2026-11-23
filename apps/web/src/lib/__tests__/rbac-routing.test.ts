import { describe, expect, it } from "bun:test";
import { isAtLeastRole } from "@/lib/permissions";
import {
	getCanonicalDashboardRoute,
	ROLE_DASHBOARD_MAP,
} from "@/lib/rbac-config";

describe("RBAC Dashboard Routing & Permissions", () => {
	it("maps customer role to /customer", () => {
		expect(getCanonicalDashboardRoute("Customer")).toBe("/customer");
		expect(getCanonicalDashboardRoute("customer")).toBe("/customer");
	});

	it("maps sales role to /sales", () => {
		expect(getCanonicalDashboardRoute("Salesperson")).toBe("/sales");
		expect(getCanonicalDashboardRoute("sales_person")).toBe("/sales");
		expect(getCanonicalDashboardRoute("sales")).toBe("/sales");
	});

	it("maps superadmin role to /superadmin", () => {
		expect(getCanonicalDashboardRoute("Super Admin")).toBe("/superadmin");
		expect(getCanonicalDashboardRoute("superadmin")).toBe("/superadmin");
		expect(getCanonicalDashboardRoute("super_admin")).toBe("/superadmin");
	});

	it("maps admin role to /admin", () => {
		expect(getCanonicalDashboardRoute("Admin")).toBe("/admin");
		expect(getCanonicalDashboardRoute("admin")).toBe("/admin");
	});

	it("defaults unknown or missing roles to /customer (NEVER /sales)", () => {
		expect(getCanonicalDashboardRoute("UnknownRole")).toBe("/customer");
		expect(getCanonicalDashboardRoute("")).toBe("/customer");
		expect(getCanonicalDashboardRoute(null as any)).toBe("/customer");
		expect(getCanonicalDashboardRoute(undefined as any)).toBe("/customer");
	});

	it("prevents customer from escalating to sales, admin, or manager", () => {
		expect(isAtLeastRole("customer", "sales_person")).toBe(false);
		expect(isAtLeastRole("customer", "admin")).toBe(false);
		expect(isAtLeastRole("customer", "manager")).toBe(false);
		expect(isAtLeastRole("customer", "super_admin")).toBe(false);
	});

	it("allows higher hierarchy roles to access lower role requirements", () => {
		expect(isAtLeastRole("sales_person", "customer")).toBe(true);
		expect(isAtLeastRole("admin", "sales_person")).toBe(true);
		expect(isAtLeastRole("super_admin", "admin")).toBe(true);
	});

	it("strictly isolates finance dashboard from HR, Warehouse, Picker, Packer, and other departmental dashboards", () => {
		const { isRouteAllowedForRole } = require("@/lib/permissions");

		// Finance can access finance routes
		expect(isRouteAllowedForRole("finance", "/finance")).toBe(true);
		expect(isRouteAllowedForRole("finance", "/finance/invoices")).toBe(true);
		expect(isRouteAllowedForRole("finance", "/finance/payroll")).toBe(true);
		expect(isRouteAllowedForRole("finance", "/attendance")).toBe(true);
		expect(isRouteAllowedForRole("finance", "/settings")).toBe(true);

		// Finance CANNOT access other operational dashboards
		expect(isRouteAllowedForRole("finance", "/hr")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/hr/employees")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/warehouse")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/dashboard/warehouse")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/picker")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/packer")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/loader")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/putter")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/driver")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/sales")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/admin")).toBe(false);
		expect(isRouteAllowedForRole("finance", "/superadmin")).toBe(false);
	});

	it("strictly isolates warehouse floor roles from other departments", () => {
		const { isRouteAllowedForRole } = require("@/lib/permissions");

		// Picker
		expect(isRouteAllowedForRole("picker", "/picker")).toBe(true);
		expect(isRouteAllowedForRole("picker", "/finance")).toBe(false);
		expect(isRouteAllowedForRole("picker", "/hr")).toBe(false);
		expect(isRouteAllowedForRole("picker", "/packer")).toBe(false);
		expect(isRouteAllowedForRole("picker", "/admin")).toBe(false);

		// Packer
		expect(isRouteAllowedForRole("packer", "/packer")).toBe(true);
		expect(isRouteAllowedForRole("packer", "/finance")).toBe(false);
		expect(isRouteAllowedForRole("packer", "/hr")).toBe(false);
		expect(isRouteAllowedForRole("packer", "/picker")).toBe(false);

		// Driver
		expect(isRouteAllowedForRole("driver", "/driver")).toBe(true);
		expect(isRouteAllowedForRole("driver", "/finance")).toBe(false);
		expect(isRouteAllowedForRole("driver", "/hr")).toBe(false);
		expect(isRouteAllowedForRole("driver", "/warehouse")).toBe(false);
	});

	it("grants superadmin access to all dashboard routes", () => {
		const { isRouteAllowedForRole } = require("@/lib/permissions");

		expect(isRouteAllowedForRole("super_admin", "/superadmin")).toBe(true);
		expect(isRouteAllowedForRole("super_admin", "/admin")).toBe(true);
		expect(isRouteAllowedForRole("super_admin", "/finance")).toBe(true);
		expect(isRouteAllowedForRole("super_admin", "/hr")).toBe(true);
		expect(isRouteAllowedForRole("super_admin", "/warehouse")).toBe(true);
		expect(isRouteAllowedForRole("super_admin", "/picker")).toBe(true);
	});
});
