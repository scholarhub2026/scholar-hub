import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MentorListing from "./pages/MentorListing";
import MentorProfile from "./pages/MentorProfile";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalModal from "./components/common/GlobalModal";
import InqueryPage from "./components/inquery/InqueryPage";
import MentorDetails from "./pages/MentorDetailsPage";

import ClassPage from "./pages/Subject";
import SubjectPage from "./pages/SubjectPage";
import AboutUs from "./pages/AboutUs";
import TermsAndConditions from "./pages/TermsAndCondition";
import ProfilePage from "./pages/ProfilePage";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PrivacyPolicy from "./pages/PrivacyPage";
import CookiePolicy from "./pages/CookiesPage";
import ContactUs from "./pages/ContactUs";
import ShippingPolicy from "./pages/ShippingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import BookingTable from "./components/BookingPage/BookingTable";
import UpdatePassword from "./components/profile-page/UpdatePassword";

const queryClient = new QueryClient();

const renderRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/about" element={<AboutUs />} />
    <Route path="/terms" element={<TermsAndConditions />} />
    <Route path="/mentors" element={<MentorListing />} />
    <Route path="/login" element={<LoginPage defaultType="login" />} />
    <Route path="/signup" element={<LoginPage defaultType="signup" />} />
    <Route path="/mentors/:id" element={<MentorProfile />} />
     <Route path="/booking/:id" element={<BookingPage />} />
     <Route path="/cookies" element={<CookiePolicy/>} />
     <Route path="/privacy" element={<PrivacyPolicy/>} />
     <Route path="/contact-us" element={<ContactUs/>} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/cancellations-and-refunds" element={<RefundPolicy />} />
        <Route path="/dashboard/settings" element={<UpdatePassword />} />
         


    {/* Protected Routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/profile/:id"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/inquery"
      element={
        <ProtectedRoute>
          <InqueryPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/mentors"
      element={
        <ProtectedRoute>
          <MentorDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/classes"
      element={
        <ProtectedRoute>
          <ClassPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/subjects"
      element={
        <ProtectedRoute>
          <SubjectPage />
        </ProtectedRoute>
      }
    />
     <Route
      path="/dashboard/bookings"
      element={
        <ProtectedRoute>
          <BookingTable />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/sessions"
      element={
        <ProtectedRoute>
          <BookingTable />
        </ProtectedRoute>
      }
    />
     <Route
      path="/dashboard/schedule"
      element={
        <ProtectedRoute>
          <BookingTable />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <LanguageProvider>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {renderRoutes()}
            <GlobalModal />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LocalizationProvider>
  </LanguageProvider>
);

export default App;
