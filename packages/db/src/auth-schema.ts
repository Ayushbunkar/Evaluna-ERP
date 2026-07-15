import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth core tables — extended for Evaluna ERP
// ─────────────────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  // ── Better Auth core ───────────────────────────────────────────────────────
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),

  // ── Evaluna ERP extensions ─────────────────────────────────────────────────
  /** ERP role: admin | manager | auditor | putter | picker | biller | sales_person */
  role: text("role").default("sales_person").notNull(),
  /** Branch this user primarily belongs to. NULL = superadmin (all branches) */
  branch_id: integer("branch_id"),
  /** Prevents login when false */
  is_active: boolean("is_active").default(true).notNull(),
  /** Cross-branch superadmin flag */
  is_superadmin: boolean("is_superadmin").default(false).notNull(),

  // ── Security ───────────────────────────────────────────────────────────────
  /** Increments on each failed login attempt */
  failed_login_count: integer("failed_login_count").default(0).notNull(),
  /** Account locked until this timestamp after too many failures */
  locked_until: timestamp("locked_until"),
  /** When the password was last changed (for expiry policies) */
  password_changed_at: timestamp("password_changed_at"),
  /** Tracks last activity for idle session detection */
  last_active_at: timestamp("last_active_at"),

  // ── Offline Authentication ─────────────────────────────────────────────────
  /** SHA-256 hash of the offline token stored on device */
  offline_token_hash: text("offline_token_hash"),
  /** Offline token expiry (max 72h from last online login) */
  offline_token_expires_at: timestamp("offline_token_expires_at"),

  // ── Remember Me ────────────────────────────────────────────────────────────
  /** Opaque remember-me token (hashed) for long-lived sessions */
  remember_me_token: text("remember_me_token"),

  // ── 2FA ────────────────────────────────────────────────────────────────────
  two_factor_enabled: boolean("two_factor_enabled").default(false),
  two_factor_secret: text("two_factor_secret"),
  two_factor_backup_codes: text("two_factor_backup_codes"),
});

export const session = pgTable(
  "session",
  {
    // ── Better Auth core ─────────────────────────────────────────────────────
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // ── Evaluna ERP extensions ───────────────────────────────────────────────
    /** Branch context for this session (may differ from user.branch_id for superadmins) */
    branch_id: integer("branch_id"),
    /** Human-readable device name, e.g. "Chrome on Windows" */
    device_name: text("device_name"),
    /** Canvas fingerprint or navigator hash for device tracking */
    device_fingerprint: text("device_fingerprint"),
    /** True when session was created/validated offline */
    is_offline: boolean("is_offline").default(false),
    /** Extends session expiry to 30 days */
    remember_me: boolean("remember_me").default(false),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
