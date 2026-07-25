/**
 * Backup Engine — Phase 42: Enterprise Disaster Recovery
 *
 * Features:
 * - Full database snapshot (all tables)
 * - AES-256-GCM encryption (using Node crypto)
 * - Backup metadata + checksum (SHA-256)
 * - Backup verification (checksum re-validation)
 * - Point-in-time restore with pre-restore validation
 * - Cloud upload stub (S3 / Cloudflare R2 compatible)
 * - Recovery simulation (dry-run restore)
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import {
  branches, staff, customers, suppliers, products,
  orders, orderItems, transactions, stockLedger,
  branchInventory, purchases, purchaseItems, expenses,
  journalEntries, journalEntryLines, accounts,
} from "@evaluna/db/schema";

// ── Config ─────────────────────────────────────────────────────────────────────
export const BACKUPS_DIR = path.join(process.cwd(), "backups");
const ENCRYPTION_KEY_HEX = process.env.BACKUP_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface BackupMetadata {
  id: string;
  version: "2.0";
  created_at: string;
  trigger: "manual" | "scheduled" | "auto" | "pre-restore";
  encrypted: boolean;
  checksum: string; // SHA-256 of raw JSON
  table_counts: Record<string, number>;
  size_bytes: number;
  label?: string;
}

export interface BackupFile {
  metadata: BackupMetadata;
  data: Record<string, unknown[]>;
}

export interface BackupEntry {
  filename: string;
  metadata: BackupMetadata;
  size_bytes: number;
  created_at: string;
}

// ── Checksum ───────────────────────────────────────────────────────────────────
function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

// ── Encryption ────────────────────────────────────────────────────────────────
function deriveKey(): Buffer {
  if (ENCRYPTION_KEY_HEX && ENCRYPTION_KEY_HEX.length === 64) {
    return Buffer.from(ENCRYPTION_KEY_HEX, "hex");
  }
  // Deterministic fallback key — NOT secure for production
  return crypto.scryptSync("evaluna-fallback-key", "evaluna-salt", 32);
}

export function encryptBackup(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv(12B) + authTag(16B) + encrypted — all hex joined with ":"
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptBackup(ciphertext: string): string {
  const key = deriveKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted backup format");
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// ── Data Collection ───────────────────────────────────────────────────────────
async function collectAllData(): Promise<Record<string, unknown[]>> {
  const [
    branchRows, staffRows, customerRows, supplierRows, productRows,
    orderRows, orderItemRows, transactionRows, stockLedgerRows,
    inventoryRows, purchaseRows, purchaseItemRows, expenseRows,
    journalEntryRows, journalLineRows, accountRows,
  ] = await Promise.all([
    db.select().from(branches),
    db.select().from(staff),
    db.select().from(customers),
    db.select().from(suppliers),
    db.select().from(products),
    db.select().from(orders),
    db.select().from(orderItems),
    db.select().from(transactions),
    db.select().from(stockLedger),
    db.select().from(branchInventory),
    db.select().from(purchases),
    db.select().from(purchaseItems),
    db.select().from(expenses),
    db.select().from(journalEntries),
    db.select().from(journalEntryLines),
    db.select().from(accounts),
  ]);

  return {
    branches:         branchRows,
    staff:            staffRows,
    customers:        customerRows,
    suppliers:        supplierRows,
    products:         productRows,
    orders:           orderRows,
    orderItems:       orderItemRows,
    transactions:     transactionRows,
    stockLedger:      stockLedgerRows,
    branchInventory:  inventoryRows,
    purchases:        purchaseRows,
    purchaseItems:    purchaseItemRows,
    expenses:         expenseRows,
    journalEntries:   journalEntryRows,
    journalEntryLines:journalLineRows,
    accounts:         accountRows,
  };
}

// ── Create Backup ─────────────────────────────────────────────────────────────
export async function createBackup(opts: {
  trigger?: BackupMetadata["trigger"];
  label?: string;
  encrypt?: boolean;
}): Promise<{ filename: string; metadata: BackupMetadata }> {
  const shouldEncrypt = opts.encrypt ?? !!ENCRYPTION_KEY_HEX;
  const data = await collectAllData();
  const rawJson = JSON.stringify(data);
  const checksum = sha256(rawJson);

  const table_counts: Record<string, number> = {};
  for (const [table, rows] of Object.entries(data)) {
    table_counts[table] = rows.length;
  }

  const metadata: BackupMetadata = {
    id: crypto.randomUUID(),
    version: "2.0",
    created_at: new Date().toISOString(),
    trigger: opts.trigger ?? "manual",
    encrypted: shouldEncrypt,
    checksum,
    table_counts,
    size_bytes: 0, // filled after writing
    label: opts.label,
  };

  const payload = shouldEncrypt ? encryptBackup(rawJson) : rawJson;
  const backupFile: BackupFile = { metadata, data: shouldEncrypt ? {} : data } as any;

  const ext = shouldEncrypt ? ".enc.json" : ".json";
  const slug = opts.label ? `-${opts.label.replace(/\s+/g, "-").toLowerCase()}` : "";
  const filename = `backup-${Date.now()}${slug}${ext}`;
  const filePath = path.join(BACKUPS_DIR, filename);

  // Write: for encrypted files store metadata + ciphertext separately
  const fileContent = shouldEncrypt
    ? JSON.stringify({ metadata, ciphertext: payload })
    : JSON.stringify({ metadata, data }, null, 2);

  fs.writeFileSync(filePath, fileContent, "utf-8");

  const stats = fs.statSync(filePath);
  metadata.size_bytes = stats.size;

  // Patch metadata with actual size
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  parsed.metadata.size_bytes = stats.size;
  fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf-8");

  return { filename, metadata };
}

// ── List Backups ──────────────────────────────────────────────────────────────
export function listBackups(): BackupEntry[] {
  if (!fs.existsSync(BACKUPS_DIR)) return [];

  return fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const filePath = path.join(BACKUPS_DIR, file);
      const stats = fs.statSync(filePath);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const meta: BackupMetadata = content.metadata ?? {
          id: file,
          version: "2.0",
          created_at: stats.birthtime.toISOString(),
          trigger: "manual",
          encrypted: false,
          checksum: "",
          table_counts: {},
          size_bytes: stats.size,
        };
        return { filename: file, metadata: meta, size_bytes: stats.size, created_at: meta.created_at };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime()) as BackupEntry[];
}

// ── Verify Backup ─────────────────────────────────────────────────────────────
export function verifyBackup(filename: string): { valid: boolean; reason?: string } {
  const filePath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filePath)) return { valid: false, reason: "File not found" };

  try {
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const meta: BackupMetadata = content.metadata;
    if (!meta) return { valid: false, reason: "No metadata block found" };

    // Re-derive the raw JSON and verify checksum
    let rawJson: string;
    if (meta.encrypted && content.ciphertext) {
      rawJson = decryptBackup(content.ciphertext);
    } else {
      rawJson = JSON.stringify(content.data);
    }

    const computedChecksum = sha256(rawJson);
    if (computedChecksum !== meta.checksum) {
      return { valid: false, reason: `Checksum mismatch — file may be corrupted. Expected ${meta.checksum.slice(0, 8)}… got ${computedChecksum.slice(0, 8)}…` };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : "Parse error" };
  }
}

// ── Read Backup Data ──────────────────────────────────────────────────────────
export function readBackupData(filename: string): Record<string, unknown[]> {
  const filePath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error("Backup file not found");

  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const meta: BackupMetadata = content.metadata;

  if (meta?.encrypted && content.ciphertext) {
    return JSON.parse(decryptBackup(content.ciphertext));
  }
  return content.data ?? {};
}

// ── Delete Backup ─────────────────────────────────────────────────────────────
export function deleteBackup(filename: string): void {
  const filePath = path.join(BACKUPS_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// ── Recovery Simulation (Dry Run) ─────────────────────────────────────────────
export function simulateRestore(filename: string): {
  can_restore: boolean;
  table_counts: Record<string, number>;
  warnings: string[];
  checksum_valid: boolean;
} {
  const verification = verifyBackup(filename);
  if (!verification.valid) {
    return {
      can_restore: false,
      table_counts: {},
      warnings: [verification.reason ?? "Verification failed"],
      checksum_valid: false,
    };
  }

  try {
    const data = readBackupData(filename);
    const table_counts: Record<string, number> = {};
    const warnings: string[] = [];

    for (const [table, rows] of Object.entries(data)) {
      table_counts[table] = Array.isArray(rows) ? rows.length : 0;
      if (table_counts[table] === 0) {
        warnings.push(`Table '${table}' has no rows — this will clear existing data`);
      }
    }

    return { can_restore: true, table_counts, warnings, checksum_valid: true };
  } catch (err) {
    return {
      can_restore: false,
      table_counts: {},
      warnings: [err instanceof Error ? err.message : "Unknown error"],
      checksum_valid: true,
    };
  }
}

// ── Cloud Upload Stub ─────────────────────────────────────────────────────────
/**
 * Stub for S3 / Cloudflare R2 / Google Cloud Storage upload.
 * Configure BACKUP_CLOUD_PROVIDER, BACKUP_CLOUD_BUCKET, BACKUP_CLOUD_KEY env vars.
 * Replace with actual SDK calls.
 */
export async function uploadToCloud(filename: string): Promise<{ url: string }> {
  const filePath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error("Backup file not found");

  const provider = process.env.BACKUP_CLOUD_PROVIDER ?? "s3";
  const bucket = process.env.BACKUP_CLOUD_BUCKET ?? "evaluna-backups";

  // Stub implementation — log and return mock URL
  console.log(`[BackupEngine] Would upload ${filename} to ${provider}://${bucket}/${filename}`);

  // ── Real S3 implementation (uncomment when ready):
  // const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  // const client = new S3Client({ region: process.env.AWS_REGION });
  // const fileBuffer = fs.readFileSync(filePath);
  // await client.send(new PutObjectCommand({ Bucket: bucket, Key: filename, Body: fileBuffer }));

  return { url: `https://${bucket}.s3.amazonaws.com/${filename}` };
}
