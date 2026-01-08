import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateLinkId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export const create = mutation({
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

    // Check if a magic link already exists for this company
    const existingLink = await ctx.db
      .query("magicLinks")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .first();

    if (existingLink) {
      // Return existing link instead of creating a new one
      return existingLink._id;
    }

    const linkId = generateLinkId();

    return await ctx.db.insert("magicLinks", {
      companyId: args.companyId,
      linkId,
      isActive: true,
      createdBy: userId,
    });
  },
});

export const getCompanyLink = query({
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

    return await ctx.db
      .query("magicLinks")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .first();
  },
});

export const getCompanyLinks = query({
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

    return await ctx.db
      .query("magicLinks")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const toggleActive = mutation({
  args: {
    linkId: v.id("magicLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Link not found");
    }

    // Check if user is a manager of this company
    const manager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("companyId"), link.companyId))
      .first();

    if (!manager) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.linkId, {
      isActive: !link.isActive,
    });
  },
});

export const getByLinkId = query({
  args: {
    linkId: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("magicLinks")
      .withIndex("by_link_id", (q) => q.eq("linkId", args.linkId))
      .first();

    if (!link || !link.isActive) {
      return null;
    }

    const company = await ctx.db.get(link.companyId);
    return {
      ...link,
      company,
    };
  },
});
