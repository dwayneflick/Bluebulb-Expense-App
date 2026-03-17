import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/Layout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import MyExpenses from "@/pages/MyExpenses";
import ExpenseApproval from "@/pages/ExpenseApproval";
import MyRetirements from "@/pages/MyRetirements";
import RetireApproval from "@/pages/RetireApproval";
import Help from "@/pages/Help";
import AdminUsers from "@/pages/AdminUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/expenses">
        <ProtectedLayout><MyExpenses /></ProtectedLayout>
      </Route>
      <Route path="/approvals">
        <ProtectedLayout><ExpenseApproval /></ProtectedLayout>
      </Route>
      <Route path="/retirements">
        <ProtectedLayout><MyRetirements /></ProtectedLayout>
      </Route>
      <Route path="/retire-approvals">
        <ProtectedLayout><RetireApproval /></ProtectedLayout>
      </Route>
      <Route path="/help">
        <ProtectedLayout><Help /></ProtectedLayout>
      </Route>
      <Route path="/admin/users">
        <ProtectedLayout><AdminUsers /></ProtectedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
