import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  companies: defineTable({
    name: v.string(),
    createdBy: v.id("users"), // manager who created the company
  }).index("by_creator", ["createdBy"]),

  magicLinks: defineTable({
    companyId: v.id("companies"),
    linkId: v.string(), // unique identifier for the magic link
    name: v.optional(v.string()), // descriptive name for the link (optional for backward compatibility)
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_link_id", ["linkId"])
    .index("by_creator", ["createdBy"]),

  reports: defineTable({
    companyId: v.id("companies"),
    magicLinkId: v.id("magicLinks"),
    title: v.string(),
    description: v.string(),
    category: v.string(), // "issue", "concern", "feedback", "other"
    isAnonymous: v.boolean(),
    reporterName: v.optional(v.string()),
    reporterEmail: v.optional(v.string()),
    status: v.string(), // "new", "reviewing", "in_progress", "resolved", "closed"
    priority: v.string(), // "low", "medium", "high", "urgent"
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_magic_link", ["magicLinkId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  managers: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    role: v.string(), // "owner", "admin", "manager"
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"]),

  invitations: defineTable({
    companyId: v.id("companies"),
    email: v.string(),
    invitedBy: v.id("users"),
    token: v.string(),
    status: v.string(), // "pending", "accepted", "expired"
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_company", ["companyId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
