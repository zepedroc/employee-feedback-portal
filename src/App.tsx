import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./Dashboard";
import { CompanySetup } from "./CompanySetup";
import { ReportForm } from "./ReportForm";
import { InviteAccept } from "./InviteAccept";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/report/:linkId" element={<ReportForm />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

function MainApp() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xs h-16 flex justify-between items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary h-6 w-6 rounded-sm rotate-3" />
          <h2 className="text-xl font-bold tracking-tight">Feedback Portal</h2>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster position="bottom-right" closeButton richColors />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userCompany = useQuery(api.companies.getUserCompany);

  if (loggedInUser === undefined || userCompany === undefined) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Unauthenticated>
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Manager Portal</h1>
            <p className="text-xl text-muted-foreground">Sign in to manage your company's feedback system</p>
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
