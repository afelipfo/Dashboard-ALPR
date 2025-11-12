import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Detections table - stores all license plate detection records
 */
export const detections = mysqlTable("detections", {
  id: int("id").autoincrement().primaryKey(),
  /** Detected license plate text (cleaned and validated) */
  plateText: varchar("plateText", { length: 20 }).notNull(),
  /** OCR confidence score (0-100) */
  confidence: int("confidence").notNull(),
  /** Bounding box coordinates as JSON: {x_min, y_min, x_max, y_max} */
  bbox: text("bbox").notNull(),
  /** S3 URL to original uploaded image */
  originalImageUrl: text("originalImageUrl").notNull(),
  /** S3 URL to cropped plate image */
  croppedImageUrl: text("croppedImageUrl"),
  /** Detection status: OK, LOW_CONFIDENCE, NO_PLATE_FOUND, MANUAL_REVIEW */
  status: mysqlEnum("status", ["OK", "LOW_CONFIDENCE", "NO_PLATE_FOUND", "MANUAL_REVIEW"]).default("OK").notNull(),
  /** Optional camera/source identifier */
  cameraId: varchar("cameraId", { length: 64 }),
  /** User who uploaded the image */
  userId: int("userId").references(() => users.id),
  /** Timestamp of detection */
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Detection = typeof detections.$inferSelect;
export type InsertDetection = typeof detections.$inferInsert;

/**
 * System configuration table
 */
export const systemConfig = mysqlTable("systemConfig", {
  id: int("id").autoincrement().primaryKey(),
  /** Configuration key */
  configKey: varchar("configKey", { length: 64 }).notNull().unique(),
  /** Configuration value as JSON string */
  configValue: text("configValue").notNull(),
  /** Description of the configuration */
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

/**
 * Audit log table for tracking access to detection records
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** User who accessed the record */
  userId: int("userId").references(() => users.id),
  /** Detection record that was accessed */
  detectionId: int("detectionId").references(() => detections.id),
  /** Action performed: VIEW, DELETE, EXPORT */
  action: mysqlEnum("action", ["VIEW", "DELETE", "EXPORT"]).notNull(),
  /** IP address of the user */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** Timestamp of the action */
  actionAt: timestamp("actionAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;