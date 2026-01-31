import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LanguageProvider } from "@/lib/i18n";
import { usePreferences } from "@/hooks/usePreferences";
import Index from "./pages/Index";
import PlanPage from "./pages/PlanPage";
import PassportPage from "./pages/PassportPage";
import SettingsPage from "./pages/SettingsPage";
import ExhibitionsPage from "./pages/ExhibitionsPage";
import ExhibitionDetailPage from "./pages/ExhibitionDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component to connect LanguageProvider with preferences
function AppWithLanguage() {
  const { preferences, updatePreferences, isLoading } = usePreferences();

  return (
    <LanguageProvider 
      externalLanguage={isLoading ? undefined : preferences.language}
      onLanguageChange={(language) => updatePreferences({ language })}
    >
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/passport" element={<PassportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/exhibitions" element={<ExhibitionsPage />} />
            <Route path="/exhibitions/:exhibition_id" element={<ExhibitionDetailPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </LanguageProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppWithLanguage />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
