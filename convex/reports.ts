import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submit = mutation({
  args: {
    magicLinkId: v.id("magicLinks"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    isAnonymous: v.boolean(),
    reporterName: v.optional(v.string()),
    reporterEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const magicLink = await ctx.db.get(args.magicLinkId);
    if (!magicLink || !magicLink.isActive) {
      throw new Error("Invalid or inactive magic link");
    }

    return await ctx.db.insert("reports", {
      companyId: magicLink.companyId,
      magicLinkId: args.magicLinkId,
      title: args.title,
      description: args.description,
      category: args.category,
      isAnonymous: args.isAnonymous,
      reporterName: args.reporterName,
      reporterEmail: args.reporterEmail,
      status: "new",
      priority: "medium",
    });
  },
});

export const getCompanyReports = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a manager of this company
    const manager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("companyId"), args.companyId))
      .first();

    if (!manager) {
      throw new Error("Not authorized");
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    // Get assigned users for each report
    const reportsWithLinks = await Promise.all(
      reports.map(async (report) => {
        const assignedUser = report.assignedTo ? await ctx.db.get(report.assignedTo) : null;
        return {
          ...report,
          assignedUserName: assignedUser?.name || assignedUser?.email || null,
        };
      })
    );

    return reportsWithLinks;
  },
});

export const updateStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.string(),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Check if user is a manager of this company
    const manager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("companyId"), report.companyId))
      .first();

    if (!manager) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.priority !== undefined) {
      updates.priority = args.priority;
    }

    if (args.assignedTo !== undefined) {
      updates.assignedTo = args.assignedTo;
    }

    if (args.notes !== undefined) {
      updates.notes = args.notes;
    }

    await ctx.db.patch(args.reportId, updates);
  },
});

export const getReport = query({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Check if user is a manager of this company
    const manager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("companyId"), report.companyId))
      .first();

    if (!manager) {
      throw new Error("Not authorized");
    }

    const assignedUser = report.assignedTo ? await ctx.db.get(report.assignedTo) : null;

    return {
      ...report,
      assignedUserName: assignedUser?.name || assignedUser?.email || null,
    };
  },
});
