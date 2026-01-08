import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

interface MagicLinksProps {
  companyId: Id<"companies">;
}

export function MagicLinks({ companyId }: MagicLinksProps) {
  const [showForm, setShowForm] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const magicLinks = useQuery(api.magicLinks.getCompanyLinks, { companyId });
  const createLink = useMutation(api.magicLinks.create);
  const toggleActive = useMutation(api.magicLinks.toggleActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim()) return;

    setIsLoading(true);
    try {
      await createLink({ companyId, name: linkName.trim() });
      setLinkName("");
      setShowForm(false);
      toast.success("Magic link created successfully!");
    } catch (error) {
      toast.error("Failed to create magic link");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (linkId: Id<"magicLinks">) => {
    try {
      await toggleActive({ linkId });
      toast.success("Link status updated");
    } catch (error) {
      toast.error("Failed to update link status");
      console.error(error);
    }
  };

  const copyToClipboard = (linkId: string) => {
    const url = `${window.location.origin}/report/${linkId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Magic Links</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Create New Link
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="linkName" className="block text-sm font-medium text-gray-700 mb-2">
                Link Name
              </label>
              <input
                id="linkName"
                type="text"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="e.g., HR Issues, Safety Concerns, General Feedback"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading || !linkName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setLinkName("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {magicLinks?.map((link) => (
          <div key={link._id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{link.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created {new Date(link._creationTime).toLocaleDateString()}
                </p>
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                  {window.location.origin}/report/{link.linkId}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    link.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {link.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => copyToClipboard(link.linkId)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Copy
                </button>
                <button
                  onClick={() => handleToggleActive(link._id)}
                  className={`px-3 py-1 text-sm rounded ${
                    link.isActive
                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                >
                  {link.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {magicLinks?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No magic links created yet. Create your first link to start receiving reports.
          </div>
        )}
      </div>
    </div>
  );
}
