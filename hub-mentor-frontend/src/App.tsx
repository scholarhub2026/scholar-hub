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
const AdminUsersPage = lazy(() => import("./features/admin/users/AdminUsersPage"));
const AdminReviewsPage = lazy(() => import("./features/admin/reviews/AdminReviewsPage"));
const AdminReferralsPage = lazy(() => import("./features/admin/referrals/AdminReferralsPage"));

// Mentor
const MentorDashboard = lazy(() => import("./features/mentor/dashboard/MentorDashboard"));
const MentorEarningsPage = lazy(() => import("./features/mentor/earnings/MentorEarningsPage"));
const MentorReviewsPage = lazy(() => import("./features/mentor/reviews/MentorReviewsPage"));
const MentorAvailabilityPage = lazy(() => import("./features/mentor/availability/MentorAvailabilityPage"));

// Student
const StudentDashboard = lazy(() => import("./features/student/dashboard/StudentDashboard"));
const StudentReviewsPage = lazy(() => import("./features/student/reviews/StudentReviewsPage"));
const ReferPage = lazy(() => import("./features/student/refer/ReferPage"));

// Shared authenticated
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UpdatePassword = lazy(() => import("./components/profile-page/UpdatePassword"));

const queryClient = new QueryClient();

const admin = (el: JSX.Element) => <RequireRole roles={[ROLES.ADMIN]}>{el}</RequireRole>;
const mentor = (el: JSX.Element) => <RequireRole roles={[ROLES.TUTOR]}>{el}</RequireRole>;
const student = (el: JSX.Element) => <RequireRole roles={[ROLES.STUDENT]}>{el}</RequireRole>;

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

      {/* ---------- Admin (ADMIN) ---------- */}
      <Route path="/admin" element={admin(<Dashboard />)} />
      <Route path="/admin/inquery" element={admin(<InqueryPage />)} />
      <Route path="/admin/mentors" element={admin(<MentorDetails />)} />
      <Route path="/admin/classes" element={admin(<ClassPage />)} />
      <Route path="/admin/subjects" element={admin(<SubjectPage />)} />
      <Route path="/admin/bookings" element={admin(<BookingTable />)} />
      <Route path="/admin/ads" element={admin(<AdminAdsPage />)} />
      <Route path="/admin/reviews" element={admin(<AdminReviewsPage />)} />
      <Route path="/admin/referrals" element={admin(<AdminReferralsPage />)} />
      <Route path="/admin/users" element={admin(<AdminUsersPage />)} />
      <Route path="/admin/profile/:id" element={admin(<ProfilePage />)} />
      <Route path="/admin/settings" element={admin(<UpdatePassword />)} />

      {/* ---------- Mentor (TUTOR) ---------- */}
      <Route path="/mentor" element={mentor(<MentorDashboard />)} />
      <Route path="/mentor/schedule" element={mentor(<BookingTable />)} />
      <Route path="/mentor/earnings" element={mentor(<MentorEarningsPage />)} />
      <Route path="/mentor/availability" element={mentor(<MentorAvailabilityPage />)} />
      <Route path="/mentor/reviews" element={mentor(<MentorReviewsPage />)} />
      <Route path="/mentor/profile/:id" element={mentor(<ProfilePage />)} />
      <Route path="/mentor/settings" element={mentor(<UpdatePassword />)} />

      {/* ---------- Student (STUDENT) ---------- */}
      <Route path="/app" element={student(<StudentDashboard />)} />
      <Route path="/app/bookings" element={student(<BookingTable />)} />
      <Route path="/app/reviews" element={student(<StudentReviewsPage />)} />
      <Route path="/app/refer" element={student(<ReferPage />)} />
      <Route path="/app/settings" element={student(<UpdatePassword />)} />

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
