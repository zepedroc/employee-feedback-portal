import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal query to fetch manager and report information needed for email notification
 */
export const getManagerAndReportInfo = internalQuery({
  args: {
    reportId: v.id("reports"),
  },
  returns: v.union(
    v.object({
      managerEmail: v.string(),
      reportTitle: v.string(),
      reportCategory: v.string(),
      reportDescription: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      return null;
    }

    // Get the magic link to find the manager who created it
    const magicLink = await ctx.db.get(report.magicLinkId);
    if (!magicLink) {
      return null;
    }

    // Get the manager's user record to get their email
    const manager = await ctx.db.get(magicLink.createdBy);
    if (!manager || !manager.email) {
      return null;
    }

    return {
      managerEmail: manager.email,
      reportTitle: report.title,
      reportCategory: report.category,
      reportDescription: report.description,
    };
  },
});

/**
 * Internal query to fetch invitation information needed for email notification
 */
export const getInvitationInfo = internalQuery({
  args: {
    invitationId: v.id("invitations"),
  },
  returns: v.union(
    v.object({
      email: v.string(),
      token: v.string(),
      companyName: v.string(),
      inviterName: v.optional(v.string()),
      inviterEmail: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      return null;
    }

    const company = await ctx.db.get(invitation.companyId);
    if (!company) {
      return null;
    }

    const inviter = await ctx.db.get(invitation.invitedBy);
    if (!inviter || !inviter.email) {
      return null;
    }

    return {
      email: invitation.email,
      token: invitation.token,
      companyName: company.name,
      inviterName: inviter.name,
      inviterEmail: inviter.email,
    };
  },
});
