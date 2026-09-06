import { getAuthUser } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const user = await getAuthUser();
		if (!user) {
			return NextResponse.json({ 
				success: false, 
				message: "No active session found. Please log in first." 
			}, { status: 401 });
		}

		return NextResponse.json({
			success: true,
			sessionUser: {
				id: user.userId,
				email: user.email,
				name: user.name,
				status: user.status,
				isSuperadmin: user.isSuperadmin,
				branchId: user.branchId,
				warehouseId: user.warehouseId,
				primaryRole: user.primaryRole,
				roles: user.roles,
				permissions: user.permissions,
				canonicalDashboardRoute: user.canonicalDashboardRoute,
			}
		});
	} catch (error: any) {
		return NextResponse.json({ 
			success: false, 
			error: error.message || String(error) 
		}, { status: 500 });
	}
}
