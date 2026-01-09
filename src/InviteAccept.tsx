import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";

export function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const invitation = useQuery(
    api.invitations.getInvitationByToken,
    token ? { token } : "skip"
  );
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);

  // Check if user email matches invitation email after sign in
  useEffect(() => {
    if (loggedInUser && invitation && loggedInUser.email === invitation.email && !isAccepting) {
      // User signed in with matching email, they can now accept
      // Don't auto-accept, let them click the button
    }
  }, [loggedInUser, invitation, isAccepting]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      const result = await acceptInvitation({ token });
      toast.success("Invitation accepted! Welcome to the team.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
      setIsAccepting(false);
    }
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
              <strong>Your email:</strong> {invitation.email}
            </p>
          </div>

          <Authenticated>
            <Button
              onClick={handleAccept}
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
          </Authenticated>

          <Unauthenticated>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Please sign in or create an account with the email <strong>{invitation.email}</strong> to accept this invitation.
                </p>
                <SignInForm />
              </div>
            </div>
          </Unauthenticated>
        </CardContent>
      </Card>
    </div>
  );
}
