import { UserCog } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGetInqueryQuery } from "@/api/form-query/get-inquery";
import { handleOpenModal } from "@/contexts/modal-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { store } from "@/contexts/store";
import { snapshot, useSnapshot } from "valtio";

const Dashboard = () => {
  const { data, isLoading, isSuccess, isError, error } = useGetInqueryQuery({});
  const snap = snapshot(store);
 


  
  
  const commingInquery = data?.data || [];

  return (
    <DashboardLayout userRole={store.getUserRole()}>
      {store.getUserRole() === "mentor" && snap.loggedUser.is_first_login === true && (
        <Card className="mb-6 h-16 flex items-center justify-between px-5">
          <Label className="text-red-600 font-semibold animate-blink">
            Your profile is incomplete. Update it to make it visible for
            students
          </Label>
          <Button className="blink" variant="outline" size="sm">
            <Link to={`/dashboard/profile/${snap.getLoggedUser().id}`}>
              Update Profile
            </Link>
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Inquery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commingInquery.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last session on May 20, 2023
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hours Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all subjects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        {store.getUserRole() === "admin" && (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex gap-2">
                    Comming Inqueries
                    <div className="bg-red-500 rounded-full text-white size-6 flex justify-center items-center text-lg">
                      {
                        commingInquery.filter(
                          (session) => session.status === "PENDING"
                        ).length
                      }
                    </div>
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Link to="/dashboard/inquery">View All</Link>
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
                    Error: {error.message}
                  </div>
                ) : isSuccess && commingInquery.length > 0 ? (
                  <div className="space-y-4">
                    {commingInquery
                      .filter((session) => session.status === "PENDING")
                      .map((session) => (
                        <div
                          key={session._id}
                          className="flex justify-between items-start p-4 border rounded-lg"
                        >
                          {/* Left side */}
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                              {session.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium capitalize">
                                {session.name}
                              </div>
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

                          {/* Right side */}
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <div className="font-medium">{session.email}</div>
                              <div className="text-sm text-muted-foreground">
                                {session.phoneNumber}
                              </div>
                            </div>
                            <div>
                              <button
                                onClick={() =>
                                  handleOpenModal("status", session._id)
                                }
                              >
                                <UserCog />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You have no upcoming sessions</p>
                    <Button variant="outline" className="mt-4">
                      <Link to="/mentors">Find a Mentor</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
