import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const title = searchParams.get("title") || "Evaluna ERP";
		const description =
			searchParams.get("description") ||
			"Enterprise Resource Planning & POS Billing Platform";

		return new ImageResponse(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					justifyContent: "space-between",
					backgroundColor: "#090d16",
					padding: "80px",
					fontFamily: "sans-serif",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
					<div
						style={{
							width: "48px",
							height: "48px",
							borderRadius: "12px",
							backgroundColor: "#3b82f6",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#ffffff",
							fontSize: "28px",
							fontWeight: "bold",
						}}
					>
						E
					</div>
					<span
						style={{
							fontSize: "32px",
							fontWeight: "bold",
							color: "#ffffff",
							letterSpacing: "-0.02em",
						}}
					>
						Evaluna ERP
					</span>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
					<div
						style={{
							fontSize: "56px",
							fontWeight: "800",
							color: "#ffffff",
							lineHeight: 1.15,
							letterSpacing: "-0.03em",
							maxWidth: "1000px",
						}}
					>
						{title}
					</div>
					<div
						style={{
							fontSize: "26px",
							color: "#94a3b8",
							lineHeight: 1.4,
							maxWidth: "900px",
						}}
					>
						{description}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						width: "100%",
						borderTop: "1px solid #1e293b",
						paddingTop: "32px",
					}}
				>
					<div
						style={{
							display: "flex",
							gap: "32px",
							color: "#64748b",
							fontSize: "20px",
						}}
					>
						<span>Retail POS</span>
						<span>•</span>
						<span>Warehouse WMS</span>
						<span>•</span>
						<span>Field Sales GPS</span>
						<span>•</span>
						<span>GST Billing</span>
					</div>
					<span
						style={{
							color: "#3b82f6",
							fontSize: "20px",
							fontWeight: "600",
						}}
					>
						evalunaerp.vercel.app
					</span>
				</div>
			</div>,
			{
				width: 1200,
				height: 630,
			},
		);
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Internal Error";
		return new Response(`Failed to generate image: ${message}`, {
			status: 500,
		});
	}
}
