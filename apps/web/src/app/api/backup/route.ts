import { NextResponse } from "next/server";
import { pglite } from "@/lib/db";

export async function GET() {
  try {
    // PGlite allows dumping its data directory as a tarball (or File/Blob depending on platform)
    // In Node.js, it dumps as a Buffer or Blob containing a tar archive of the database
    const file = await pglite.dumpDataDir("tar");

    // Convert to buffer if it's a File or Blob
    let buffer: Buffer;
    if (file instanceof Blob || file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      buffer = Buffer.from(file as any);
    }

    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `evaluna-erp-backup-${date}.tar`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/x-tar",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
