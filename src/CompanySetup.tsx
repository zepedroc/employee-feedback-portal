import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function CompanySetup() {
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createCompany = useMutation(api.companies.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setIsLoading(true);
    try {
      await createCompany({ name: companyName.trim() });
      toast.success("Company created successfully!");
    } catch (error) {
      toast.error("Failed to create company");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">Setup Your Company</h1>
        <p className="text-lg text-secondary">
          Create your company profile to start receiving employee feedback
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company name"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !companyName.trim()}
          className="w-full px-4 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Company"}
        </button>
      </form>
    </div>
  );
}
