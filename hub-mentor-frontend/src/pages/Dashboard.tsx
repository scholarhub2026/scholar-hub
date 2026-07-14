import { UserCog } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGetInqueryQuery } from "@/api/form-query/get-inquery";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { handleOpenModal } from "@/contexts/modal-state";
import { Skeleton } from "@/components/ui/skeleton";

// Admin dashboard. Mentor/Student dashboards live in their own feature folders.
const Dashboard = () => {
  const { data, isLoading, isSuccess, isError, error } = useGetInqueryQuery({});
  const { data: mentorData } = useGetMentorQuery({ type: "approve", limit: 1000 });
  const commingInquery = data?.data || [];
  const pending = commingInquery.filter((s) => s.status === "PENDING");
  const mentorCount = mentorData?.data?.length ?? 0;

  return (
    <DashboardLayout userRole="admin">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Enquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pending.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commingInquery.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Mentors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mentorCount}</div>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/admin/mentors">Manage Mentors</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Incoming enquiries */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex gap-2">
                  Incoming Enquiries
                  <div className="bg-red-500 rounded-full text-white size-6 flex justify-center items-center text-lg">
                    {pending.length}
                  </div>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/inquery">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : isError ? (
                <div className="text-center py-8 text-red-500">
                  Error: {(error as Error)?.message}
                </div>
              ) : isSuccess && pending.length > 0 ? (
                <div className="space-y-4">
                  {pending.map((session) => (
                    <div
                      key={session._id}
                      className="flex justify-between items-start p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                          {session.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{session.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.subject}
                          </div>
                          {session.message && (
                            <div className="mt-2 text-sm p-2 bg-muted rounded-md text-muted-foreground max-w-md break-words">
                              {session.message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="font-medium">{session.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.phoneNumber}
                          </div>
                        </div>
                        <button onClick={() => handleOpenModal("status", session._id)}>
                          <UserCog />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending enquiries.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
