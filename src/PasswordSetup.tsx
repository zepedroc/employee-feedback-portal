"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface PasswordSetupProps {
  email: string;
  onComplete?: () => void;
}

export function PasswordSetup({ email, onComplete }: PasswordSetupProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      // Normalize email to lowercase for consistency
      formData.set("email", email.toLowerCase().trim());
      formData.set("password", password);
      formData.set("flow", "signUp");
      
      await signIn("password", formData);
      toast.success("Password set successfully! Welcome to the team.");
      if (onComplete) {
        onComplete();
      } else {
        navigate("/");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to set password";
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Set Your Password</CardTitle>
        <CardDescription className="text-center">
          Create a password for <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Setting password..." : "Set Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
