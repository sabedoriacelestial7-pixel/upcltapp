import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import ConsultaPage from "@/pages/ConsultaPage";
import ResultadoPage from "@/pages/ResultadoPage";
import SimuladorPage from "@/pages/SimuladorPage";
import PerfilPage from "@/pages/PerfilPage";
import AjudaPage from "@/pages/AjudaPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consulta"
              element={
                <ProtectedRoute>
                  <ConsultaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resultado"
              element={
                <ProtectedRoute>
                  <ResultadoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulador"
              element={
                <ProtectedRoute>
                  <SimuladorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ajuda"
              element={
                <ProtectedRoute>
                  <AjudaPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
