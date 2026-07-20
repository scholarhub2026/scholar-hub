import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, CheckCircle2, Mail, Phone, User } from "lucide-react";
import {
  useMentorRequestsQuery,
  useTeacherAcceptMutation,
  useTeacherDeclineMutation,
  type RequestBooking,
} from "@/api/booking/lifecycle-api";

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const FREQ_LABEL: Record<string, string> = {
  "per-session": "Per session",
  weekly: "Weekly",
  monthly: "Monthly",
  daily: "Monthly",
};

const MentorRequestsPage = () => {
  const { data, isLoading, isError } = useMentorRequestsQuery();
  const accept = useTeacherAcceptMutation();
  const decline = useTeacherDeclineMutation();

  const [accepting, setAccepting] = useState<RequestBooking | null>(null);
  const [declining, setDeclining] = useState<RequestBooking | null>(null);
  const [reason, setReason] = useState("");

  const requests = data?.bookings ?? [];

  const submitDecline = () => {
    if (!declining) return;
    decline.mutate(
      { bookingId: declining._id, reason: reason.trim() || undefined },
      { onSuccess: () => setDeclining(null) },
    );
  };

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Booking requests</h1>
          <p className="text-sm text-muted-foreground">
            Students approved by Scholar Hub, waiting for you to accept.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load requests.
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-muted-foreground">
            No pending requests.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((b) => (
              <Card key={b._id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold capitalize text-slate-900">
                        <User className="h-4 w-4 text-primary" />
                        {b.studentName || b.studentId?.firstName || "Student"}
                      </div>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {b.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> {b.email}
                          </div>
                        )}
                        {b.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {b.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {FREQ_LABEL[b.paymentFrequency] ?? "Monthly"}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Class</span>
                      <span className="font-medium capitalize text-slate-800">
                        {b.selectedClass?.class_id?.class || "—"}
                        {b.selectedSyllabus ? ` · ${b.selectedSyllabus}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span className="font-medium capitalize text-slate-800">
                        {b.bookingType}
                        {b.selectedSubjects?.length
                          ? ` · ${b.selectedSubjects.length} subject${b.selectedSubjects.length === 1 ? "" : "s"}`
                          : ""}
                      </span>
                    </div>
                    {b.classStartDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Starts</span>
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {fmtDate(b.classStartDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {b.message && (
                    <p className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600">
                      “{b.message}”
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setAccepting(b)}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setReason("");
                        setDeclining(b);
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Accept confirmation */}
      <Dialog
        open={!!accepting}
        onOpenChange={(open) => !open && setAccepting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this booking?</DialogTitle>
            <DialogDescription>
              Accepting starts the booking — your fees will be locked in for it
              and the student will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccepting(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={accept.isPending}
              onClick={() =>
                accept.mutate(accepting._id, {
                  onSuccess: () => setAccepting(null),
                })
              }
            >
              Accept booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline with reason */}
      <Dialog
        open={!!declining}
        onOpenChange={(open) => !open && setDeclining(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this booking</DialogTitle>
            <DialogDescription>
              The student will be notified. A short reason is optional.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)…"
            className="resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclining(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={decline.isPending}
              onClick={submitDecline}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MentorRequestsPage;
