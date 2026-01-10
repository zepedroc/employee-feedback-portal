import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId, createAccount } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const inviteManager = mutation({
  args: {
    companyId: v.id("companies"),
    email: v.string(),
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

    // Check if email already has manager access
    // Note: This query may be slow without an email index, but invitations are infrequent
    const allUsers = await ctx.db.query("users").collect();
    const existingUser = allUsers.find((user: any) => user.email === args.email);

    if (existingUser) {
      const existingManager = await ctx.db
        .query("managers")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .filter((q) => q.eq(q.field("companyId"), args.companyId))
        .first();

      if (existingManager) {
        throw new Error("User is already a manager of this company");
      }
    }

    // Check for pending invitation
    const pendingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => 
        q.and(
          q.eq(q.field("companyId"), args.companyId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (pendingInvitation) {
      throw new Error("Invitation already sent to this email");
    }

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

    const invitationId = await ctx.db.insert("invitations", {
      companyId: args.companyId,
      email: args.email,
      invitedBy: userId,
      token,
      status: "pending",
      expiresAt,
    });

    // Schedule email notification
    await ctx.scheduler.runAfter(0, api.notifications.sendInvitationEmail, {
      invitationId,
    });

    return invitationId;
  },
});

export const getInvitationByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return null;
    }

    // Check if expired
    if (invitation.expiresAt < Date.now()) {
      return null;
    }

    const company = await ctx.db.get(invitation.companyId);
    const inviter = await ctx.db.get(invitation.invitedBy);

    return {
      ...invitation,
      company,
      inviter: inviter ? { name: inviter.name, email: inviter.email } : null,
    };
  },
});

export const getCompanyInvitations = query({
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

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return invitations;
  },
});

// Accept invitation - works with anonymous users
// User should be signed in anonymously before calling this
export const acceptInvitationWithoutAuth = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user (can be anonymous)
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Please sign in first");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been accepted or expired");
    }

    if (invitation.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    // Get current user
    const currentUser = await ctx.db.get(userId);
    
    // Check if user with invitation email already exists (case-insensitive)
    const invitationEmailLower = invitation.email.toLowerCase().trim();
    const allUsers = await ctx.db.query("users").collect();
    const existingUserWithEmail = allUsers.find((user: any) => 
      user.email?.toLowerCase().trim() === invitationEmailLower
    );

    let targetUserId = userId;

    if (existingUserWithEmail && existingUserWithEmail._id !== userId) {
      // User with this email already exists
      // Check if they're already a manager
      const existingManager = await ctx.db
        .query("managers")
        .withIndex("by_user", (q) => q.eq("userId", existingUserWithEmail._id))
        .filter((q) => q.eq(q.field("companyId"), invitation.companyId))
        .first();

      if (existingManager) {
        // Already a manager, just mark invitation as accepted
        await ctx.db.patch(invitation._id, { status: "accepted" });
        return { companyId: invitation.companyId, userId: existingUserWithEmail._id, needsPassword: false };
      }
      
      // Use the existing user instead
      targetUserId = existingUserWithEmail._id;
    } else {
      // Update current user's email to match invitation (normalize email)
      if (currentUser) {
        await ctx.db.patch(userId, { email: invitationEmailLower });
      }
    }

    // Check if user is already a manager
    const existingManager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("companyId"), invitation.companyId))
      .first();

    if (existingManager) {
      // Already a manager, just mark invitation as accepted
      await ctx.db.patch(invitation._id, { status: "accepted" });
      return { companyId: invitation.companyId, userId: targetUserId, needsPassword: false };
    }

    // Add user as manager
    await ctx.db.insert("managers", {
      userId: targetUserId,
      companyId: invitation.companyId,
      role: "manager",
    });

    // Create magic link for the new manager
    const linkId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
    
    await ctx.db.insert("magicLinks", {
      companyId: invitation.companyId,
      linkId,
      isActive: true,
      createdBy: targetUserId,
    });

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, { status: "accepted" });

    return { companyId: invitation.companyId, userId: targetUserId, needsPassword: true };
  },
});

// Original acceptInvitation for authenticated users
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been accepted or expired");
    }

    if (invitation.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    // Verify user's email matches invitation email
    const user = await ctx.db.get(userId);
    if (!user || user.email !== invitation.email) {
      throw new Error("Email does not match invitation");
    }

    // Check if user is already a manager
    const existingManager = await ctx.db
      .query("managers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("companyId"), invitation.companyId))
      .first();

    if (existingManager) {
      // Already a manager, just mark invitation as accepted
      await ctx.db.patch(invitation._id, { status: "accepted" });
      return { companyId: invitation.companyId };
    }

    // Add user as manager
    await ctx.db.insert("managers", {
      userId,
      companyId: invitation.companyId,
      role: "manager",
    });

    // Create magic link for the new manager
    const linkId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
    
    await ctx.db.insert("magicLinks", {
      companyId: invitation.companyId,
      linkId,
      isActive: true,
      createdBy: userId,
    });

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, { status: "accepted" });

    return { companyId: invitation.companyId };
  },
});
