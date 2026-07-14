import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useBookingsQuery } from "@/api/booking/getBookings";
import { useCreateReviewMutation } from "@/api/review/create-review";

type Booking = {
  _id: string;
  mentorId?: { _id: string; firstName?: string; email?: string } | string;
  sessionType?: string;
  createdAt?: string;
};

const mentorOf = (b: Booking) =>
  b.mentorId && typeof b.mentorId === "object" ? b.mentorId : undefined;

const RateDialog = ({
  studentId,
  booking,
}: {
  studentId: string;
  booking: Booking;
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReviewMutation();
  const mentor = mentorOf(booking);

  const submit = async () => {
    if (!mentor?._id) return;
    if (rating < 1) {
      toast.error("Pick a rating");
      return;
    }
    await createReview.mutateAsync({
      studentId,
      mentorId: mentor._id,
      rating,
      comment: comment.trim(),
      bookingId: booking._id,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Rate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">
            Rate {mentor?.firstName || "your mentor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= (hover || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <Textarea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={createReview.isPending}>
            {createReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StudentReviewsPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useBookingsQuery({ studentId: user?.id });
  const bookings: Booking[] = data?.bookings ?? [];

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rate your mentors</h1>
          <p className="text-sm text-muted-foreground">
            Leave a review for mentors you've booked sessions with.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              Failed to load your bookings.
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              You haven't booked any sessions yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const mentor = mentorOf(b);
              return (
                <Card key={b._id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">
                        {mentor?.firstName || "Mentor"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {b.sessionType || "Session"}
                      </div>
                    </div>
                    {user?.id && mentor?._id ? (
                      <RateDialog studentId={user.id} booking={b} />
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentReviewsPage;
