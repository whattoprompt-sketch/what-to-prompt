import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Wizard from "./pages/Wizard";
import Result from "./pages/Result";
import Help from "./pages/Help";
import Templates from "./pages/Templates";
import HistoryPage from "@/pages/HistoryPage";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import GoogleAnalytics from "./components/GoogleAnalytics";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GoogleAnalytics />
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/result" element={<Result />} />
          <Route path="/help" element={<Help />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
