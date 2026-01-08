import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Create the company
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      createdBy: userId,
    });

    // Add the creator as the owner
    await ctx.db.insert("managers", {
      userId,
      companyId,
      role: "owner",
    });

    return companyId;
  },
});

export const getUserCompany = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const manager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!manager) {
      return null;
    }

    const company = await ctx.db.get(manager.companyId);
    return company ? { ...company, role: manager.role } : null;
  },
});

export const getCompanyManagers = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a manager of this company
    const userManager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("companyId"), args.companyId))
      .first();

    if (!userManager) {
      throw new Error("Not authorized");
    }

    const managers = await ctx.db
      .query("managers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const managersWithUsers = await Promise.all(
      managers.map(async (manager) => {
        const user = await ctx.db.get(manager.userId);
        return {
          ...manager,
          user,
        };
      })
    );

    return managersWithUsers;
  },
});
