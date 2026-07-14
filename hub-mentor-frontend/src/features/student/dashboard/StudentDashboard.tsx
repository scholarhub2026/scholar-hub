import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from "react-router-dom";
import { Gift, Search, Star } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useActiveAdsQuery } from "@/api/ad/ad-api";
import { useReferralQuery } from "@/api/referral/referral-api";
import { useBookingsQuery } from "@/api/booking/getBookings";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: ads = [] } = useActiveAdsQuery();
  const { data: referral } = useReferralQuery(user?.id);
  const { data: bookings } = useBookingsQuery({ studentId: user?.id });
  const { data: mentorData, isLoading: mentorsLoading } = useGetMentorQuery({
    type: "approve",
    limit: 6,
  });

  const upcoming =
    bookings?.pagination?.totalRecords ?? bookings?.bookings?.length ?? 0;
  const mentors = (mentorData?.data ?? []).slice(0, 6);

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <Button asChild>
            <Link to="/mentors">
              <Search className="mr-2 h-4 w-4" /> Find a Mentor
            </Link>
          </Button>
        </div>

        {/* Ads carousel */}
        {ads.length > 0 && (
          <Carousel className="w-full">
            <CarouselContent>
              {ads.map((ad) => (
                <CarouselItem key={ad._id}>
                  <a
                    href={ad.linkUrl || "#"}
                    target={ad.linkUrl ? "_blank" : undefined}
                    rel="noreferrer"
                  >
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="h-44 w-full rounded-lg object-cover"
                    />
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            {ads.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcoming}</div>
              <Link to="/app/bookings" className="text-xs text-primary hover:underline">
                View bookings
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reward Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{referral?.rewardBalance ?? 0}</div>
              <Link to="/app/refer" className="text-xs text-primary hover:underline">
                Refer &amp; earn
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-brand-gradient text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                Invite friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/app/refer">
                  <Gift className="mr-2 h-4 w-4" /> Share your code
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recommended mentors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recommended mentors</h2>
            <Link to="/mentors" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          {mentorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : mentors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No mentors available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mentors.map((m: Record<string, any>) => (
                <Card key={m._id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                        {m.profile_pic ? (
                          <img
                            src={m.profile_pic}
                            alt={m.firstName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-primary">
                            {(m.firstName ?? "M").charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium capitalize truncate">
                          {`${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Mentor"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {m.education_qualification || m.experience || "Mentor"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {Number(m.rating || 0).toFixed(1)}
                      </div>
                      {m.location && <Badge variant="outline">{m.location}</Badge>}
                    </div>
                    <Button className="w-full mt-3" size="sm" asChild>
                      <Link to={`/mentors/${m._id}`}>View profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
