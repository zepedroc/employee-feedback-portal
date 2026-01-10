import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Reports } from "./Reports";
import { Id } from "../convex/_generated/dataModel";
import { Copy, Check, LayoutDashboard, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Company {
  _id: Id<"companies">;
  name: string;
  role: string;
}

interface DashboardProps {
  company: Company;
}

export function Dashboard({ company }: DashboardProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const magicLink = useQuery(api.magicLinks.getManagerLink, { companyId: company._id });
  const createMagicLink = useMutation(api.magicLinks.create);
  const inviteManager = useMutation(api.invitations.inviteManager);
  const pendingInvitations = useQuery(api.invitations.getCompanyInvitations, { companyId: company._id });

  // Auto-create magic link if it doesn't exist
  useEffect(() => {
    if (magicLink === null && createMagicLink) {
      createMagicLink({ companyId: company._id }).catch((error) => {
        console.error("Failed to create magic link:", error);
      });
    }
  }, [magicLink, createMagicLink, company._id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await inviteManager({ companyId: company._id, email: inviteEmail.trim() });
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!magicLink) return;
    const url = `${window.location.origin}/report/${magicLink.linkId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  const magicLinkUrl = magicLink ? `${window.location.origin}/report/${magicLink.linkId}` : "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-lg text-muted-foreground">
            Manage your employee feedback system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Reporting Link</CardTitle>
          <CardDescription>
            Share this link with your employees to collect their feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                readOnly
                value={magicLinkUrl}
                placeholder="Generating link..."
              />
            </div>
            <Button
              onClick={() => void copyToClipboard()}
              disabled={!magicLink}
              className={`flex items-center gap-2 ${isCopied ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Manager
          </CardTitle>
          <CardDescription>
            Invite another manager to join your company. They'll get their own magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleInvite(e)} className="space-y-4">
            <div className="flex gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="manager@example.com"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                  {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </div>
          </form>

          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Pending Invitations</Label>
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => {
                  const date = new Date(invitation.expiresAt);
                  const day = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const year = date.getFullYear();
                  const formattedDate = `${day} ${month} ${year}`;
                  
                  return (
                    <div
                      key={invitation._id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{invitation.email}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        </div>
        <Reports companyId={company._id} />
      </div>
    </div>
  );
}
