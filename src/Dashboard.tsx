import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Reports } from "./Reports";
import { Id } from "../convex/_generated/dataModel";
import { Copy } from "lucide-react";
import { toast } from "sonner";

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
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">{company.name}</h1>
        <p className="text-lg text-secondary">
          Manage your employee feedback system
        </p>
      </div>

      {/* Magic Link Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Magic Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={magicLinkUrl}
            placeholder="Generating link..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={copyToClipboard}
            disabled={!magicLink}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>

      {/* Reports Section */}
      <div className="mb-6">
        <div className="bg-gray-100 p-1 rounded-lg inline-block">
          <div className="px-4 py-2 font-medium text-primary bg-white shadow-sm rounded-md">
            Reports
            {newReportsCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {newReportsCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <Reports companyId={company._id} />
    </div>
  );
}
