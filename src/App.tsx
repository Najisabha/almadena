import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import Exams from "./pages/Exams";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StudentResults from "./pages/StudentResults";
import Instructors from "./pages/Instructors";
import LicenseRequirements from "./pages/LicenseRequirements";
import PricingInfo from "./pages/PricingInfo";
import StudentLookup from "./pages/StudentLookup";
import MockExamSelector from "./pages/MockExamSelector";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/student-results" element={<StudentResults />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/license-requirements" element={<LicenseRequirements />} />
              <Route path="/pricing" element={<PricingInfo />} />
              <Route path="/student-lookup" element={<StudentLookup />} />
              <Route path="/mock-exams" element={<MockExamSelector />} />
              <Route path="/mock-exam" element={<MockExam />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudentsPage />} />
              <Route path="/admin/success-stories" element={<AdminSuccessStoriesPage />} />
              <Route path="/admin/questions" element={<AdminQuestionsPage />} />
              <Route path="/admin/pricing" element={<AdminPricingPage />} />
              <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
              <Route path="/admin/materials" element={<AdminMaterialsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
