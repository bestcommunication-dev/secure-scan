import { Switch, Route, useHashLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Scanner from "@/pages/scanner";
import Reports from "@/pages/reports";
import Compliance from "@/pages/compliance";
import Plans from "@/pages/plans";
import Login from "@/pages/login";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  return (
    <Switch useLocation={useHashLocation}>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Login} />

      {/* Temporary solution: all routes are accessible without login */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/reports" component={Reports} />
      <Route path="/compliance" component={Compliance} />
      <Route path="/plans" component={Plans} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Create a ProtectedRoute component in client/src/components/protected-route.tsx
export default App;
