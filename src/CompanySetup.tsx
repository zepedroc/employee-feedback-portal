import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Setup Your Company</CardTitle>
          <CardDescription className="text-lg">
            Create your company profile to start receiving employee feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !companyName.trim()}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create Company"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
