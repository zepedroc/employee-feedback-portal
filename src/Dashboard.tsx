import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Reports } from "./Reports";
import { Id } from "../convex/_generated/dataModel";
import { Copy, LayoutDashboard } from "lucide-react";
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
  const reports = useQuery(api.reports.getCompanyReports, { companyId: company._id });
  const magicLink = useQuery(api.magicLinks.getCompanyLink, { companyId: company._id });
  const createMagicLink = useMutation(api.magicLinks.create);

  const newReportsCount = reports?.filter(r => r.status === "new").length || 0;

  // Auto-create magic link if it doesn't exist
  useEffect(() => {
    if (magicLink === null && createMagicLink) {
      createMagicLink({ companyId: company._id }).catch((error) => {
        console.error("Failed to create magic link:", error);
      });
    }
  }, [magicLink, createMagicLink, company._id]);

  const copyToClipboard = () => {
    if (!magicLink) return;
    const url = `${window.location.origin}/report/${magicLink.linkId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
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
          <CardTitle>Magic Link</CardTitle>
          <CardDescription>
            Share this link with your employees to collect anonymous feedback.
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
              onClick={copyToClipboard}
              disabled={!magicLink}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          {newReportsCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
              {newReportsCount} New
            </span>
          )}
        </div>
        <Reports companyId={company._id} />
      </div>
    </div>
  );
}
