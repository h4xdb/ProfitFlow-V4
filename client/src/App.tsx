import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import ReceiptBooks from "@/pages/receipt-books";
import Receipts from "@/pages/receipts";
import Expenses from "@/pages/expenses";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import Backup from "@/pages/backup";
import PublicReports from "@/pages/public-reports";
import Layout from "@/components/layout/layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function AdminOrManagerRoute({ children }: { children: React.ReactNode }) {
  const { isAdminOrManager } = useAuth();
  
  if (!isAdminOrManager) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/public-reports" component={PublicReports} />
      
      {/* Auth routes */}
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      
      {/* Protected routes */}
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/tasks">
        <ProtectedRoute>
          <AdminOrManagerRoute>
            <Tasks />
          </AdminOrManagerRoute>
        </ProtectedRoute>
      </Route>
      
      <Route path="/receipt-books">
        <ProtectedRoute>
          <ReceiptBooks />
        </ProtectedRoute>
      </Route>
      
      <Route path="/receipts">
        <ProtectedRoute>
          <Receipts />
        </ProtectedRoute>
      </Route>
      
      <Route path="/expenses">
        <ProtectedRoute>
          <AdminOrManagerRoute>
            <Expenses />
          </AdminOrManagerRoute>
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <AdminOrManagerRoute>
            <Reports />
          </AdminOrManagerRoute>
        </ProtectedRoute>
      </Route>
      
      <Route path="/users">
        <ProtectedRoute>
          <AdminRoute>
            <Users />
          </AdminRoute>
        </ProtectedRoute>
      </Route>
      
      <Route path="/backup">
        <ProtectedRoute>
          <AdminOrManagerRoute>
            <Backup />
          </AdminOrManagerRoute>
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
