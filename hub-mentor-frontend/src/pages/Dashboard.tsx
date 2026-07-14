import { UserCog, Users, Inbox, Briefcase, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGetInqueryQuery } from "@/api/form-query/get-inquery";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { handleOpenModal } from "@/contexts/modal-state";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { useAuth } from "@/auth/AuthProvider";

// Admin dashboard. Mentor/Student dashboards live in their own feature folders.
const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isSuccess, isError, error } = useGetInqueryQuery({});
  const { data: mentorData } = useGetMentorQuery({ type: "approve", limit: 1000 });
  const commingInquery = data?.data || [];
  const pending = commingInquery.filter((s) => s.status === "PENDING");
  const mentorCount = mentorData?.data?.length ?? 0;

  const stats = [
    {
      label: "Pending Enquiries",
      value: pending.length,
      icon: Inbox,
      tint: "bg-amber-50 text-amber-600",
      to: "/admin/inquery",
    },
    {
      label: "Total Enquiries",
      value: commingInquery.length,
      icon: Users,
      tint: "bg-blue-50 text-blue-600",
      to: "/admin/inquery",
    },
    {
      label: "Active Mentors",
      value: mentorCount,
      icon: Briefcase,
      tint: "bg-violet-50 text-violet-600",
      to: "/admin/mentors",
    },
  ];

  return (
    <DashboardLayout userRole="admin">
      <PageHeader
        title={`Welcome back${user?.firstName ? `, ${user.firstName}` : ""}!`}
        description="Here's what's happening on Scholar Hub today."
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, tint, to }) => (
            <Card
              key={label}
              className="rounded-xl border-slate-200/80 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-2xl font-bold text-slate-900">
                    {value}
                  </div>
                  <Link
                    to={to}
                    className="text-sm text-slate-500 transition hover:text-primary"
                  >
                    {label}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Incoming enquiries */}
        <Card className="rounded-xl border-slate-200/80 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 font-display text-lg">
                Incoming Enquiries
                {pending.length > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {pending.length}
                  </span>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/inquery" className="gap-1.5">
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex flex-col space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center text-red-500">
                Error: {(error as Error)?.message}
              </div>
            ) : isSuccess && pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-start justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize text-slate-900">
                            {session.name}
                          </span>
                          <StatusBadge status={session.status} />
                        </div>
                        <div className="text-sm text-slate-500">{session.subject}</div>
                        {session.message && (
                          <p className="mt-2 max-w-md break-words rounded-lg bg-slate-50 p-2.5 text-sm text-slate-600">
                            {session.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden md:block">
                        <div className="text-sm font-medium text-slate-700">
                          {session.email}
                        </div>
                        <div className="text-sm text-slate-400">
                          {session.phoneNumber}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-primary"
                        onClick={() => handleOpenModal("status", session._id)}
                      >
                        <UserCog className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">No pending enquiries.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
