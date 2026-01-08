import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./Dashboard";
import { CompanySetup } from "./CompanySetup";
import { ReportForm } from "./ReportForm";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/report/:linkId" element={<ReportForm />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

function MainApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Employee Feedback Portal</h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userCompany = useQuery(api.companies.getUserCompany);

  if (loggedInUser === undefined || userCompany === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Manager Portal</h1>
            <p className="text-xl text-secondary">Sign in to manage your company's feedback system</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {userCompany ? (
          <Dashboard company={userCompany} />
        ) : (
          <CompanySetup />
        )}
      </Authenticated>
    </div>
  );
}
