"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";

/**
 * Action to send email notification to manager when a report is submitted
 */
export const sendReportNotification = action({
  args: {
    reportId: v.id("reports"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get manager and report info using internal query
    const info = await ctx.runQuery(internal.notificationsQueries.getManagerAndReportInfo, {
      reportId: args.reportId,
    });

    if (!info) {
      console.error("Could not find manager or report information");
      return null;
    }

    // Get Resend API key from environment variable
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return null;
    }

    // Initialize Resend
    const resend = new Resend(apiKey);

    // Helper function to escape HTML
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Send email notification
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: info.managerEmail,
        subject: `New Report Submitted: ${escapeHtml(info.reportTitle)}`,
        html: `
          <h2>New Report Submitted</h2>
          <p>A new report has been submitted and requires your attention.</p>
          
          <h3>Report Details:</h3>
          <p><strong>Title:</strong> ${escapeHtml(info.reportTitle)}</p>
          <p><strong>Category:</strong> ${escapeHtml(info.reportCategory)}</p>
          <p><strong>Description:</strong></p>
          <p>${escapeHtml(info.reportDescription)}</p>
        `,
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
      throw error;
    }

    return null;
  },
});

/**
 * Action to send invitation email to a manager
 */
export const sendInvitationEmail = action({
  args: {
    invitationId: v.id("invitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get invitation info using internal query
    const invitation = await ctx.runQuery(internal.notificationsQueries.getInvitationInfo, {
      invitationId: args.invitationId,
    });

    if (!invitation) {
      console.error("Could not find invitation information");
      return null;
    }

    // Get Resend API key from environment variable
    const apiKey = 're_LcwCvQwe_2UuM17a8QLwzNNsv2FC7fxD5'; //process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return null;
    }

    // Initialize Resend
    const resend = new Resend(apiKey);

    // Helper function to escape HTML
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const invitationUrl = `${process.env.SITE_URL || "http://localhost:5173"}/invite/${invitation.token}`;

    // Send email notification
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: invitation.email,
        subject: `You've been invited to manage ${escapeHtml(invitation.companyName)}`,
        html: `
          <h2>Manager Invitation</h2>
          <p>You've been invited by ${escapeHtml(invitation.inviterName || invitation.inviterEmail)} to become a manager for <strong>${escapeHtml(invitation.companyName)}</strong>.</p>
          
          <p>Click the link below to accept the invitation:</p>
          <p><a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
          
          <p>Or copy and paste this URL into your browser:</p>
          <p>${invitationUrl}</p>
          
          <p><small>This invitation will expire in 7 days.</small></p>
        `,
      });
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      throw error;
    }

    return null;
  },
});
