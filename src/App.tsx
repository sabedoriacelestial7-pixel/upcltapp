import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import WelcomePage from "@/pages/WelcomePage";
import SobrePage from "@/pages/SobrePage";
import HomePage from "@/pages/HomePage";
import ConsultaPage from "@/pages/ConsultaPage";
import ResultadoPage from "@/pages/ResultadoPage";
import SimulacoesPage from "@/pages/SimulacoesPage";
import ResultadoDetalhesPage from "@/pages/ResultadoDetalhesPage";
import ContratacaoPage from "@/pages/ContratacaoPage";
import PropostasPage from "@/pages/PropostasPage";
import PropostaDetalhePage from "@/pages/PropostaDetalhePage";
import PerfilPage from "@/pages/PerfilPage";
import DadosTrabalhistas from "@/pages/DadosTrabalhistas";
import SugestaoPage from "@/pages/SugestaoPage";
import TermosUsoPage from "@/pages/TermosUsoPage";
import PoliticaPrivacidadePage from "@/pages/PoliticaPrivacidadePage";
import AjudaPage from "@/pages/AjudaPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                path="/resultado/detalhes"
                element={
                  <ProtectedRoute>
                    <ResultadoDetalhesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulacoes"
                element={
                  <ProtectedRoute>
                    <SimulacoesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contratacao"
                element={
                  <ProtectedRoute>
                    <ContratacaoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/propostas"
                element={
                  <ProtectedRoute>
                    <PropostasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/propostas/:id"
                element={
                  <ProtectedRoute>
                    <PropostaDetalhePage />
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
                path="/dados-trabalhistas"
                element={
                  <ProtectedRoute>
                    <DadosTrabalhistas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sugestao"
                element={
                  <ProtectedRoute>
                    <SugestaoPage />
                  </ProtectedRoute>
                }
              />
              {/* Public Legal Pages - Required for Play Store */}
              <Route path="/termos-uso" element={<TermosUsoPage />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidadePage />} />
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
