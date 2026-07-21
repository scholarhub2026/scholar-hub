import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";

import { AuthProvider } from "@/auth/AuthProvider";
import { RequireRole, FullscreenLoader } from "@/auth/guards";
import RoleGate from "@/app/RoleGate";
import { ROLES } from "@/config/roles";
import DashboardShell from "@/layouts/DashboardShell";
import GlobalModal from "./components/common/GlobalModal";

// Route components are lazy-loaded so each role's bundle is fetched on demand,
// keeping the initial (public) payload small.
// Public
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MentorListing = lazy(() => import("./pages/MentorListing"));
const MentorProfile = lazy(() => import("./pages/MentorProfile"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndCondition"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPage"));
const CookiePolicy = lazy(() => import("./pages/CookiesPage"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));

// Admin
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InqueryPage = lazy(() => import("./components/inquery/InqueryPage"));
const MentorDetails = lazy(() => import("./pages/MentorDetailsPage"));
const ClassPage = lazy(() => import("./pages/Subject"));
const SubjectPage = lazy(() => import("./pages/SubjectPage"));
const BookingTable = lazy(() => import("./components/BookingPage/BookingTable"));
const AdminAdsPage = lazy(() => import("./features/admin/ads/AdminAdsPage"));
const AdminPaymentsPage = lazy(() => import("./features/admin/payments/AdminPaymentsPage"));
const AdminSessionsPage = lazy(() => import("./features/admin/sessions/AdminSessionsPage"));
const AdminEnquiriesPage = lazy(() => import("./features/admin/enquiries/AdminEnquiriesPage"));
const AdminSettlementsPage = lazy(() => import("./features/admin/settlements/AdminSettlementsPage"));
const AdminUsersPage = lazy(() => import("./features/admin/users/AdminUsersPage"));
const AdminReviewsPage = lazy(() => import("./features/admin/reviews/AdminReviewsPage"));
const AdminReferralsPage = lazy(() => import("./features/admin/referrals/AdminReferralsPage"));

// Mentor
const MentorDashboard = lazy(() => import("./features/mentor/dashboard/MentorDashboard"));
const MentorEarningsPage = lazy(() => import("./features/mentor/earnings/MentorEarningsPage"));
const MentorRequestsPage = lazy(() => import("./features/mentor/requests/MentorRequestsPage"));
const MentorSessionsPage = lazy(() => import("./features/mentor/sessions/MentorSessionsPage"));
const MentorReviewsPage = lazy(() => import("./features/mentor/reviews/MentorReviewsPage"));
const MentorAvailabilityPage = lazy(() => import("./features/mentor/availability/MentorAvailabilityPage"));
const MentorSubjectsPage = lazy(() => import("./features/mentor/subjects/MentorSubjectsPage"));

// Student
const StudentDashboard = lazy(() => import("./features/student/dashboard/StudentDashboard"));
const StudentReviewsPage = lazy(() => import("./features/student/reviews/StudentReviewsPage"));
const ReferPage = lazy(() => import("./features/student/refer/ReferPage"));

// Shared authenticated
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UpdatePassword = lazy(() => import("./components/profile-page/UpdatePassword"));

const queryClient = new QueryClient();

const renderRoutes = () => (
  <Suspense fallback={<FullscreenLoader />}>
    <Routes>
      {/* ---------- Public ---------- */}
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/mentors" element={<MentorListing />} />
      <Route path="/mentors/:id" element={<MentorProfile />} />
      <Route path="/booking/:id" element={<BookingPage />} />
      <Route path="/login" element={<LoginPage defaultType="login" />} />
      <Route path="/signup" element={<LoginPage defaultType="signup" />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/cancellations-and-refunds" element={<RefundPolicy />} />

      {/* ---------- Admin (ADMIN) — one persistent shell, content swaps ---------- */}
      <Route
        element={
          <RequireRole roles={[ROLES.ADMIN]}>
            <DashboardShell role="admin" />
          </RequireRole>
        }
      >
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/inquery" element={<InqueryPage />} />
        <Route path="/admin/enquiries" element={<AdminEnquiriesPage />} />
        <Route path="/admin/mentors" element={<MentorDetails />} />
        <Route path="/admin/classes" element={<ClassPage />} />
        <Route path="/admin/subjects" element={<SubjectPage />} />
        <Route path="/admin/bookings" element={<BookingTable />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/admin/sessions" element={<AdminSessionsPage />} />
        <Route path="/admin/settlements" element={<AdminSettlementsPage />} />
        <Route path="/admin/ads" element={<AdminAdsPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/referrals" element={<AdminReferralsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/profile/:id" element={<ProfilePage />} />
        <Route path="/admin/settings" element={<UpdatePassword />} />
      </Route>

      {/* ---------- Mentor (TUTOR) ---------- */}
      <Route
        element={
          <RequireRole roles={[ROLES.TUTOR]}>
            <DashboardShell role="mentor" />
          </RequireRole>
        }
      >
        <Route path="/mentor" element={<MentorDashboard />} />
        <Route path="/mentor/subjects" element={<MentorSubjectsPage />} />
        <Route path="/mentor/requests" element={<MentorRequestsPage />} />
        <Route path="/mentor/schedule" element={<BookingTable />} />
        <Route path="/mentor/sessions" element={<MentorSessionsPage />} />
        <Route path="/mentor/earnings" element={<MentorEarningsPage />} />
        <Route path="/mentor/availability" element={<MentorAvailabilityPage />} />
        <Route path="/mentor/reviews" element={<MentorReviewsPage />} />
        <Route path="/mentor/profile/:id" element={<ProfilePage />} />
        <Route path="/mentor/settings" element={<UpdatePassword />} />
      </Route>

      {/* ---------- Student (STUDENT) ---------- */}
      <Route
        element={
          <RequireRole roles={[ROLES.STUDENT]}>
            <DashboardShell role="student" />
          </RequireRole>
        }
      >
        <Route path="/app" element={<StudentDashboard />} />
        {/* Browse & book inside the student shell (not the public marketing pages) */}
        <Route path="/app/mentors" element={<MentorListing />} />
        <Route path="/app/mentors/:id" element={<MentorProfile />} />
        <Route path="/app/booking/:id" element={<BookingPage />} />
        <Route path="/app/bookings" element={<BookingTable />} />
        <Route path="/app/reviews" element={<StudentReviewsPage />} />
        <Route path="/app/refer" element={<ReferPage />} />
        <Route path="/app/settings" element={<UpdatePassword />} />
      </Route>

      {/* ---------- Backward-compat: old /dashboard/* → role home ---------- */}
      <Route path="/dashboard" element={<RoleGate />} />
      <Route path="/dashboard/*" element={<RoleGate />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {renderRoutes()}
            <GlobalModal />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </LanguageProvider>
);

export default App;
