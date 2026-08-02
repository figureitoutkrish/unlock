import { pgTable, text, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const unlockModeEnum = pgEnum("unlock_mode", [
  "instant",
  "email_gate",
  "community_gate"
]);

export const eventTypeEnum = pgEnum("event_type", [
  "click",
  "unlock", 
  "redirect",
  "iab_detected",
  "iab_escaped",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  plan: text("plan").default("free").notNull(),
});

export const links = pgTable("links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  unlockMode: unlockModeEnum("unlock_mode").notNull().default("instant"),
  label: text("label"),
  emailGateHeadline: text("email_gate_headline"),
  emailGateCta: text("email_gate_cta"),
  communityType: text("community_type"),
  communityUrl: text("community_url"),
  communityLabel: text("community_label"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const capturedEmails = pgTable("captured_emails", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  visitorIp: text("visitor_ip"),
  country: text("country"),
  userAgent: text("user_agent"),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  eventType: eventTypeEnum("event_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  meta: jsonb("meta"),
});