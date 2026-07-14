import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useMentorReviewsQuery } from "@/api/review/mentor-reviews-api";

const Stars = ({
  rating,
  className = "h-4 w-4",
}: {
  rating: number;
  className?: string;
}) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${className} ${
          i < Math.round(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

const MentorReviewsPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useMentorReviewsQuery(user?.id);
  const reviews = data?.data ?? [];

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">What students say about you.</p>
        </div>

        <Card>
          <CardContent className="flex items-center gap-6 py-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{(data?.average ?? 0).toFixed(1)}</div>
              <Stars rating={data?.average ?? 0} className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">
              Based on <span className="font-medium text-foreground">{data?.count ?? 0}</span>{" "}
              review{(data?.count ?? 0) === 1 ? "" : "s"}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              Failed to load reviews.
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No reviews yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r._id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{r.studentName || "Student"}</div>
                    <div className="flex items-center gap-3">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorReviewsPage;
