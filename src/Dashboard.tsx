import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MagicLinks } from "./MagicLinks";
import { Reports } from "./Reports";
import { Id } from "../convex/_generated/dataModel";

interface Company {
  _id: Id<"companies">;
  name: string;
  role: string;
}

interface DashboardProps {
  company: Company;
}

export function Dashboard({ company }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "links">("reports");
  const reports = useQuery(api.reports.getCompanyReports, { companyId: company._id });
  const magicLinks = useQuery(api.magicLinks.getCompanyLinks, { companyId: company._id });

  const newReportsCount = reports?.filter(r => r.status === "new").length || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">{company.name}</h1>
        <p className="text-lg text-secondary">
          Manage your employee feedback system
        </p>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "reports"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Reports
            {newReportsCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {newReportsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "links"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Magic Links
          </button>
        </nav>
      </div>

      {activeTab === "reports" && <Reports companyId={company._id} />}
      {activeTab === "links" && <MagicLinks companyId={company._id} />}
    </div>
  );
}
