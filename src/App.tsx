import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RentalProvider } from "@/contexts/RentalContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import SettingsPage from "./pages/Settings";
import InvoicePage from "./pages/Invoice";
import ReportPage from "./pages/Report";
import MaintenancePage from "./pages/Maintenance";
import TenantBillPage from "./pages/TenantBill";
import LineRegisterPage from "./pages/LineRegister";
import LeaseSignature from "./pages/LeaseSignature";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/invoice" element={<InvoicePage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/tenant-bill" element={<TenantBillPage />} />
      <Route path="/line-register" element={<LineRegisterPage />} />
      <Route path="/lease" element={<LeaseSignature />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <RentalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </RentalProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
