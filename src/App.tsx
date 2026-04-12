import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StudentResults from "./pages/StudentResults";
import Instructors from "./pages/Instructors";
import LicenseRequirements from "./pages/LicenseRequirements";
import PricingInfo from "./pages/PricingInfo";
import StudentLookup from "./pages/StudentLookup";
import Signs from "./pages/Signs";
import MockExam from "./pages/MockExam";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminSuccessStoriesPage from "./pages/admin/AdminSuccessStoriesPage";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage";
import AdminPricingPage from "./pages/admin/AdminPricingPage";
import AdminAppointmentsPage from "./pages/admin/AdminAppointmentsPage";
import AdminMaterialsPage from "./pages/admin/AdminMaterialsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminSignsPage from "./pages/admin/AdminSignsPage";
import AdminLicensesPage from "./pages/admin/AdminLicensesPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import PrivateTheoryExamList from "./pages/PrivateTheoryExamList";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ProtectedAdminRoute } from "./features/auth/AdminRoute";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen w-full flex flex-col">
            <Navigation />
            <main className="flex-1 w-full min-w-0">
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/exams" element={<Navigate to="/questions" replace />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/student-results" element={<StudentResults />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/license-requirements" element={<LicenseRequirements />} />
              <Route path="/pricing" element={<PricingInfo />} />
              <Route path="/student-lookup" element={<StudentLookup />} />
              <Route path="/signs" element={<Signs />} />
              <Route path="/mock-exams" element={<Navigate to="/questions" replace />} />
              <Route path="/mock-exam" element={<MockExam />} />
              <Route path="/questions/private" element={<PrivateTheoryExamList />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/students" element={<ProtectedAdminRoute><AdminStudentsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/success-stories" element={<ProtectedAdminRoute><AdminSuccessStoriesPage /></ProtectedAdminRoute>} />
              <Route path="/admin/questions" element={<ProtectedAdminRoute><AdminQuestionsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/pricing" element={<ProtectedAdminRoute><AdminPricingPage /></ProtectedAdminRoute>} />
              <Route path="/admin/appointments" element={<ProtectedAdminRoute><AdminAppointmentsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/materials" element={<ProtectedAdminRoute><AdminMaterialsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/signs" element={<ProtectedAdminRoute><AdminSignsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/licenses" element={<ProtectedAdminRoute><AdminLicensesPage /></ProtectedAdminRoute>} />
              <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettingsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/notifications" element={<ProtectedAdminRoute><AdminNotificationsPage /></ProtectedAdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
