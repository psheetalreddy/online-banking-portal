import { useState } from "react";
import Layout from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Accounts from "./pages/Accounts";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import Messages from "./pages/Messages";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";
import Transfer from "./pages/Transfer";

export type Page =
  | "dashboard"
  | "accounts"
  | "messages"
  | "profile"
  | "transactions"
  | "transfer"
  | "payments";

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity || identity.getPrincipal().isAnonymous()) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === "dashboard" && (
          <Dashboard onNavigate={setCurrentPage} />
        )}
        {currentPage === "accounts" && <Accounts />}
        {currentPage === "messages" && <Messages />}
        {currentPage === "profile" && <Profile />}
        {currentPage === "transactions" && <Transactions />}
        {currentPage === "transfer" && <Transfer />}
        {currentPage === "payments" && <Payments />}
      </Layout>
      <Toaster />
    </>
  );
}

export default App;
