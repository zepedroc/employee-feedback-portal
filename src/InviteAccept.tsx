import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { PasswordSetup } from "./PasswordSetup";

export function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [invitationAccepted, setInvitationAccepted] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { signIn } = useAuthActions();

  const invitation = useQuery(
    api.invitations.getInvitationByToken,
    token ? { token } : "skip"
  );
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);
  const acceptInvitationWithoutAuth = useMutation(api.invitations.acceptInvitationWithoutAuth);

  const handleAccept = async () => {
    if (!token || !invitation) return;

    setIsAccepting(true);
    try {
      // If user is authenticated and email matches, use regular accept
      if (loggedInUser && loggedInUser.email === invitation.email) {
        await acceptInvitation({ token });
        toast.success("Invitation accepted! Welcome to the team.");
        void navigate("/");
        return;
      }

      // If user is not authenticated, sign in anonymously first
      if (!loggedInUser) {
        await signIn("anonymous");
        // Wait a moment for auth to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Accept invitation (works with anonymous users)
      const result = await acceptInvitationWithoutAuth({ token });
      setInvitationAccepted(true);
      
      if (result.needsPassword) {
        setNeedsPassword(true);
        toast.success("Invitation accepted! Please set your password.");
      } else {
        toast.success("Invitation accepted! Welcome to the team.");
        void navigate("/");
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.data || String(error) || "Failed to accept invitation";
      toast.error(errorMessage);
      setIsAccepting(false);
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePasswordComplete = () => {
    void navigate("/");
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Invalid Link</CardTitle>
            <CardDescription>This invitation link is not valid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (invitation === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show password setup if invitation was accepted and password is needed
  if (invitationAccepted && needsPassword && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Invitation Accepted!</CardTitle>
            <CardDescription>
              Please set a password to complete your account setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordSetup email={invitation.email} onComplete={handlePasswordComplete} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Manager Invitation</CardTitle>
          <CardDescription>
            You've been invited to manage <strong>{invitation.company?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Company:</strong> {invitation.company?.name}
            </p>
            {invitation.inviter && (
              <p>
                <strong>Invited by:</strong> {invitation.inviter.name || invitation.inviter.email}
              </p>
            )}
            <p>
              <strong>Email:</strong> {invitation.email}
            </p>
          </div>

          <Authenticated>
            {loggedInUser && loggedInUser.email === invitation.email ? (
              <Button
                onClick={() => void handleAccept()}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            ) : (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-center text-muted-foreground">
                  You are signed in as <strong>{loggedInUser?.email}</strong>, but this invitation is for <strong>{invitation.email}</strong>.
                </p>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Please sign out to accept this invitation with the correct email.
                </p>
              </div>
            )}
          </Authenticated>

          <Unauthenticated>
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Click the button below to accept this invitation. You'll be prompted to set a password afterwards.
              </p>
              <Button
                onClick={() => void handleAccept()}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          </Unauthenticated>
        </CardContent>
      </Card>
    </div>
  );
}
