import { describe, expect, it } from "bun:test";
import { getCanonicalDashboardRoute, ROLE_DASHBOARD_MAP } from "@/lib/rbac-config";
import { isAtLeastRole } from "@/lib/permissions";

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
});
