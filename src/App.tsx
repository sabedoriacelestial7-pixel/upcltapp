import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { BiaChatProvider } from "@/contexts/BiaChatContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OfflineBanner } from "@/components/OfflineBanner";

// Lazy loaded components for code splitting
const BiaChatDrawer = lazy(() => import('@/components/BiaChatDrawer').then(m => ({ default: m.BiaChatDrawer })));
const BiaFAB = lazy(() => import('@/components/BiaFAB').then(m => ({ default: m.BiaFAB })));
const NotificationDrawer = lazy(() => import('@/components/NotificationDrawer').then(m => ({ default: m.NotificationDrawer })));

// Lazy loaded pages - reduces initial bundle size significantly
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const WelcomePage = lazy(() => import('@/pages/WelcomePage'));
const SobrePage = lazy(() => import('@/pages/SobrePage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const ConsultaPage = lazy(() => import('@/pages/ConsultaPage'));
const ResultadoPage = lazy(() => import('@/pages/ResultadoPage'));
const SimulacoesPage = lazy(() => import('@/pages/SimulacoesPage'));
const ResultadoDetalhesPage = lazy(() => import('@/pages/ResultadoDetalhesPage'));
const ContratacaoPage = lazy(() => import('@/pages/ContratacaoPage'));
const PropostasPage = lazy(() => import('@/pages/PropostasPage'));
const PropostaDetalhePage = lazy(() => import('@/pages/PropostaDetalhePage'));
const PerfilPage = lazy(() => import('@/pages/PerfilPage'));
const DadosTrabalhistas = lazy(() => import('@/pages/DadosTrabalhistas'));
const SugestaoPage = lazy(() => import('@/pages/SugestaoPage'));
const TermosUsoPage = lazy(() => import('@/pages/TermosUsoPage'));
const PoliticaPrivacidadePage = lazy(() => import('@/pages/PoliticaPrivacidadePage'));
const AjudaPage = lazy(() => import('@/pages/AjudaPage'));
const InstallPage = lazy(() => import('@/pages/InstallPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Minimal loading fallback - fast render
function PageLoader() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Toaster />
      <Sonner />
      <BiaGlobalDrawer />
      <NotificationGlobalDrawer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/sobre" element={<SobrePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/consulta" element={<ProtectedRoute><ConsultaPage /></ProtectedRoute>} />
          <Route path="/resultado" element={<ProtectedRoute><ResultadoPage /></ProtectedRoute>} />
          <Route path="/resultado/detalhes" element={<ProtectedRoute><ResultadoDetalhesPage /></ProtectedRoute>} />
          <Route path="/simulacoes" element={<ProtectedRoute><SimulacoesPage /></ProtectedRoute>} />
          <Route path="/contratacao" element={<ProtectedRoute><ContratacaoPage /></ProtectedRoute>} />
          <Route path="/propostas" element={<ProtectedRoute><PropostasPage /></ProtectedRoute>} />
          <Route path="/propostas/:id" element={<ProtectedRoute><PropostaDetalhePage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
          <Route path="/dados-trabalhistas" element={<ProtectedRoute><DadosTrabalhistas /></ProtectedRoute>} />
          <Route path="/sugestao" element={<ProtectedRoute><SugestaoPage /></ProtectedRoute>} />
          
          {/* Public Legal Pages */}
          <Route path="/termos-uso" element={<TermosUsoPage />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidadePage />} />
          <Route path="/ajuda" element={<ProtectedRoute><AjudaPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

import { useBiaChat } from '@/contexts/BiaChatContext';
import { useNotificationContext } from '@/contexts/NotificationContext';

function BiaGlobalDrawer() {
  const { isOpen, close } = useBiaChat();
  return (
    <Suspense fallback={null}>
      <BiaChatDrawer open={isOpen} onClose={close} />
      <BiaFAB />
    </Suspense>
  );
}

function NotificationGlobalDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationContext();
  
  return (
    <Suspense fallback={null}>
      <NotificationDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
      />
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <BiaChatProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </BiaChatProvider>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;