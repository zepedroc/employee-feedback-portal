"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
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

    // Get Brevo API key from environment variable
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY environment variable is not set");
      return null;
    }

    // Helper function to escape HTML
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Send email notification using Brevo API
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Employee Feedback System",
            email: "zepedrocm@hotmail.com",
          },
          to: [
            {
              email: info.managerEmail,
              name: info.managerEmail,
            },
          ],
          subject: `New Report Submitted`,
          htmlContent: `
            <html>
              <head></head>
              <body>
                <h2>New Report Submitted</h2>
                <p>A new report has been submitted and requires your attention.</p>
                
                <h3>Report Details:</h3>
                <p><strong>Title:</strong> ${escapeHtml(info.reportTitle)}</p>
                <p><strong>Category:</strong> ${escapeHtml(info.reportCategory)}</p>
                <p><strong>Description:</strong></p>
                <p>${escapeHtml(info.reportDescription)}</p>
              </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Brevo API error:", response.status, errorData);
        throw new Error(`Failed to send email: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log("Email sent successfully:", result.messageId);
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

    // Get Brevo API key from environment variable
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY environment variable is not set");
      return null;
    }

    // Helper function to escape HTML
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const invitationUrl = `http://localhost:5173/invite/${invitation.token}`;

    // Send email notification using Brevo API
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Employee Feedback System",
            email: "zepedrocm@hotmail.com",
          },
          to: [
            {
              email: invitation.email,
              name: invitation.email,
            },
          ],
          subject: `You've been invited to manage ${escapeHtml(invitation.companyName)}`,
          htmlContent: `
            <html>
              <head></head>
              <body>
                <h2>Manager Invitation</h2>
                <p>You've been invited by ${escapeHtml(invitation.inviterName || invitation.inviterEmail)} to become a manager for <strong>${escapeHtml(invitation.companyName)}</strong>.</p>
                
                <p>Click the link below to accept the invitation:</p>
                <p><a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
                
                <p>Or copy and paste this URL into your browser:</p>
                <p>${invitationUrl}</p>
                
                <p><small>This invitation will expire in 7 days.</small></p>
              </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Brevo API error:", response.status, errorData);
        throw new Error(`Failed to send email: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log("Email sent successfully:", result.messageId);
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      throw error;
    }

    return null;
  },
});
