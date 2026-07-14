import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useMentorEarningsQuery } from "@/api/mentor/earnings-api";
import { useMentorReviewsQuery } from "@/api/review/mentor-reviews-api";
import { useBookingsQuery } from "@/api/booking/getBookings";

const money = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

const MentorDashboard = () => {
  const { user } = useAuth();
  const needsProfile = user?.isFirstLogin === true || user?.completedProfile === false;

  const { data: earnings, isLoading: earningsLoading } = useMentorEarningsQuery(user?.id);
  const { data: reviews } = useMentorReviewsQuery(user?.id);
  const { data: bookings } = useBookingsQuery({ studentId: user?.id });

  const upcoming =
    bookings?.pagination?.totalRecords ?? bookings?.bookings?.length ?? 0;

  return (
    <DashboardLayout userRole="mentor">
      {needsProfile && (
        <Card className="mb-6 h-16 flex items-center justify-between px-5">
          <Label className="text-red-600 font-semibold animate-blink">
            Your profile is incomplete. Update it to make it visible for students.
          </Label>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/mentor/profile/${user?.id}`}>Update Profile</Link>
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <Button asChild variant="outline">
            <Link to="/mentor/schedule">View Schedule</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmed Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcoming}</div>
              <Link to="/mentor/schedule" className="text-xs text-primary hover:underline">
                Go to schedule
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month's Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earningsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {money(earnings?.thisMonthEarnings ?? 0)}
                </div>
              )}
              <Link to="/mentor/earnings" className="text-xs text-primary hover:underline">
                View earnings
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {(reviews?.average ?? 0).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({reviews?.count ?? 0})
                </span>
              </div>
              <Link to="/mentor/reviews" className="text-xs text-primary hover:underline">
                See reviews
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MentorDashboard;
