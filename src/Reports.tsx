import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

interface ReportsProps {
  companyId: Id<"companies">;
}

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function Reports({ companyId }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<Id<"reports"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const reports = useQuery(api.reports.getCompanyReports, { companyId });
  const selectedReportData = useQuery(
    api.reports.getReport,
    selectedReport ? { reportId: selectedReport } : "skip"
  );
  const updateStatus = useMutation(api.reports.updateStatus);
  const managers = useQuery(api.companies.getCompanyManagers, { companyId });

  const filteredReports = reports?.filter(report => 
    statusFilter === "all" || report.status === statusFilter
  ) || [];

  const handleStatusUpdate = async (
    reportId: Id<"reports">,
    status: string,
    priority?: string,
    assignedTo?: Id<"users">,
    notes?: string
  ) => {
    try {
      await updateStatus({ reportId, status, priority, assignedTo, notes });
      toast.success("Report updated successfully!");
    } catch (error) {
      toast.error("Failed to update report");
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Reports List */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              onClick={() => setSelectedReport(report._id)}
              className={`bg-white p-4 rounded-lg border shadow-sm cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedReport === report._id ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{report.title}</h3>
                <div className="flex space-x-2 ml-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[report.priority as keyof typeof priorityColors]}`}>
                    {report.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[report.status as keyof typeof statusColors]}`}>
                    {report.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {report.isAnonymous ? "Anonymous" : report.reporterName || "Confidential"} • 
                  {report.category}
                </span>
                <span>{new Date(report._creationTime).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {statusFilter === "all" 
                ? "No reports submitted yet." 
                : `No reports with status "${statusFilter}".`
              }
            </div>
          )}
        </div>
      </div>

      {/* Report Details */}
      <div className="lg:col-span-1">
        {selectedReportData ? (
          <ReportDetails 
            report={selectedReportData} 
            managers={managers || []}
            onUpdate={handleStatusUpdate}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <p className="text-gray-500 text-center">Select a report to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReportDetailsProps {
  report: any;
  managers: any[];
  onUpdate: (reportId: Id<"reports">, status: string, priority?: string, assignedTo?: Id<"users">, notes?: string) => void;
}

function ReportDetails({ report, managers, onUpdate }: ReportDetailsProps) {
  const [status, setStatus] = useState(report.status);
  const [priority, setPriority] = useState(report.priority);
  const [assignedTo, setAssignedTo] = useState(report.assignedTo || "");
  const [notes, setNotes] = useState(report.notes || "");

  const handleUpdate = () => {
    onUpdate(
      report._id,
      status,
      priority,
      assignedTo || undefined,
      notes || undefined
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-2">{report.title}</h3>
        <div className="flex space-x-2 mb-4">
          <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[report.priority as keyof typeof priorityColors]}`}>
            {report.priority}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[report.status as keyof typeof statusColors]}`}>
            {report.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
        <p className="text-gray-600 text-sm">{report.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold text-gray-700">Category:</span>
          <p className="text-gray-600 capitalize">{report.category}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Reporter:</span>
          <p className="text-gray-600">
            {report.isAnonymous ? "Anonymous" : report.reporterName || "Confidential"}
          </p>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Submitted:</span>
          <p className="text-gray-600">{new Date(report._creationTime).toLocaleDateString()}</p>
        </div>
      </div>

      {!report.isAnonymous && report.reporterEmail && (
        <div>
          <span className="font-semibold text-gray-700">Contact:</span>
          <p className="text-gray-600 text-sm">{report.reporterEmail}</p>
        </div>
      )}

      <hr />

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700">Update Report</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          >
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          >
            <option value="">Unassigned</option>
            {managers.map((manager) => (
              <option key={manager.userId} value={manager.userId}>
                {manager.user?.name || manager.user?.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            placeholder="Add internal notes..."
          />
        </div>

        <button
          onClick={handleUpdate}
          className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm"
        >
          Update Report
        </button>
      </div>
    </div>
  );
}
