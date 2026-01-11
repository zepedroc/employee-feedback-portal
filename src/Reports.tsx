import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ReportsProps {
  companyId: Id<"companies">;
}

const statusVariants = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  reviewing: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const Badge = ({ children, className }: { children: React.ReactNode, className: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${className}`}>
    {children}
  </span>
);

export function Reports({ companyId }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<Id<"reports"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOnlyMyLink, setShowOnlyMyLink] = useState(false);

  const managerLink = useQuery(api.magicLinks.getManagerLink, { companyId });
  const reports = useQuery(
    api.reports.getCompanyReports,
    {
      companyId,
    }
  );
  const selectedReportData = useQuery(
    api.reports.getReport,
    selectedReport ? { reportId: selectedReport } : "skip"
  );
  const updateStatus = useMutation(api.reports.updateStatus);
  const managers = useQuery(api.companies.getCompanyManagers, { companyId });

  const filteredReports = reports?.filter(report => {
    // Filter by magic link if toggle is enabled
    if (showOnlyMyLink && managerLink?._id) {
      if (report.magicLinkId !== managerLink._id) {
        return false;
      }
    }
    // Filter by status
    return statusFilter === "all" || report.status === statusFilter;
  }) || [];

  const handleStatusUpdate = async (
    reportId: Id<"reports">,
    status: string,
    assignedTo?: Id<"users">,
    notes?: string
  ) => {
    try {
      await updateStatus({ reportId, status, assignedTo, notes });
      toast.success("Report updated successfully!");
    } catch (error) {
      toast.error("Failed to update report");
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Reports List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">
            {showOnlyMyLink ? "My Link's Reports" : "All Reports"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="filter-toggle"
                checked={showOnlyMyLink}
                onCheckedChange={setShowOnlyMyLink}
              />
              <Label htmlFor="filter-toggle" className="text-sm cursor-pointer">
                My Link Only
              </Label>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card
              key={report._id}
              onClick={() => setSelectedReport(report._id)}
              className={`cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/5 ${selectedReport === report._id ? "border-primary ring-1 ring-primary/20 bg-accent/10" : ""
                }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base line-clamp-1">{report.title}</CardTitle>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    <Badge className={statusVariants[report.status as keyof typeof statusVariants]}>
                      {report.status.replace("_", " ")}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      {report.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 justify-end">
                <span className="text-[10px] text-muted-foreground">{formatDate(report._creationTime)}</span>
              </CardFooter>
            </Card>
          ))}

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {statusFilter === "all"
                  ? "No reports submitted yet."
                  : `No reports with status "${statusFilter}".`
                }
              </CardContent>
            </Card>
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
          <Card>
            <CardContent className="p-6 h-[200px] flex items-center justify-center text-muted-foreground text-center">
              Select a report to view details and take action
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ReportDetailsProps {
  report: any;
  managers: any[];
  onUpdate: (reportId: Id<"reports">, status: string, assignedTo?: Id<"users">, notes?: string) => void | Promise<void>;
}

function ReportDetails({ report, managers, onUpdate }: ReportDetailsProps) {
  const [status, setStatus] = useState(report.status);
  const [assignedTo, setAssignedTo] = useState(report.assignedTo || "unassigned");
  const [notes, setNotes] = useState(report.notes || "");

  const handleUpdate = async () => {
    await onUpdate(
      report._id,
      status,
      assignedTo === "unassigned" ? undefined : (assignedTo as Id<"users">),
      notes || undefined
    );
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge className={statusVariants[report.status as keyof typeof statusVariants]}>
            {report.status.replace("_", " ")}
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            {report.category}
          </Badge>
        </div>
        <CardTitle>{report.title}</CardTitle>
        <CardDescription>Submitted on {formatDate(report._creationTime)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
          <p className="text-sm leading-relaxed">{report.description}</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Update Action</h4>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Assign manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.userId} value={manager.userId}>
                    {manager.user?.name || manager.user?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details-notes">Internal Notes</Label>
            <Textarea
              id="details-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add your comments here..."
              className="resize-none"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => { void handleUpdate(); }} className="w-full">
          Update Report
        </Button>
      </CardFooter>
    </Card>
  );
}
