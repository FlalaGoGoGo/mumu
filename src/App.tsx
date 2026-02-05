import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LanguageProvider } from "@/lib/i18n";
import { ImageLoadProvider } from "@/contexts/ImageLoadContext";
import { usePreferences } from "@/hooks/usePreferences";
import Index from "./pages/Index";
import ArtPage from "./pages/ArtPage";
import MuseumDetailPage from "./pages/MuseumDetailPage";
import PassportPage from "./pages/PassportPage";
import SettingsPage from "./pages/SettingsPage";
import ExhibitionsPage from "./pages/ExhibitionsPage";
import ExhibitionDetailPage from "./pages/ExhibitionDetailPage";
import AdminCacheImagesPage from "./pages/AdminCacheImagesPage";
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
            <Route path="/art" element={<ArtPage />} />
            <Route path="/museum/:museum_id" element={<MuseumDetailPage />} />
            <Route path="/plan" element={<Navigate to="/" replace />} />
            <Route path="/passport" element={<PassportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/exhibitions" element={<ExhibitionsPage />} />
            <Route path="/exhibitions/:exhibition_id" element={<ExhibitionDetailPage />} />
            <Route path="/admin/cache-images" element={<AdminCacheImagesPage />} />
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
      <ImageLoadProvider>
        <Toaster />
        <Sonner />
        <AppWithLanguage />
      </ImageLoadProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
