import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaginationControl from "@/components/ui/PaginationController";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import {
  useSessionsQuery,
  useVerifySessionMutation,
  useRejectSessionMutation,
  type SessionRecord,
  type SessionStatus,
} from "@/api/sessions/sessions-api";

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const duration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ") || "0m";
};

const STATUS_META: Record<SessionStatus, { label: string; cls: string }> = {
  logged: { label: "Pending", cls: "bg-amber-50 text-amber-600" },
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
};

const SCOPES: Array<{ key: SessionStatus | ""; label: string }> = [
  { key: "logged", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

const personName = (ref?: { firstName?: string; lastName?: string } | string) => {
  if (!ref || typeof ref === "string") return "—";
  return `${ref.firstName ?? ""} ${ref.lastName ?? ""}`.trim() || "—";
};

const AdminSessionsPage = () => {
  const [status, setStatus] = useState<SessionStatus | "">("logged");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useSessionsQuery({
    status: status || undefined,
    page,
    limit: 10,
  });
  const sessions = data?.sessions ?? [];

  const verify = useVerifySessionMutation();
  const reject = useRejectSessionMutation();

  const [rejecting, setRejecting] = useState<SessionRecord | null>(null);
  const [reason, setReason] = useState("");

  const badge = (n?: number) =>
    n != null && n > 0 ? (
      <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
        {n}
      </span>
    ) : null;

  const bookingOf = (s: SessionRecord) =>
    typeof s.bookingId === "object" ? s.bookingId : undefined;

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Session verification</h1>
          <p className="text-sm text-muted-foreground">
            Verify mentor-logged classes before they're billed to students.
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
          {SCOPES.map((s) => (
            <button
              key={s.key || "all"}
              type="button"
              onClick={() => {
                setStatus(s.key);
                setPage(1);
              }}
              className={cn(
                "flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition",
                status === s.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {s.label}
              {s.key === "logged" && badge(data?.counts?.logged)}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                Failed to load sessions.
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                Nothing here. 🎉
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Class / Subject</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => {
                    const meta = STATUS_META[s.status];
                    const booking = bookingOf(s);
                    return (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="font-medium">{fmtDate(s.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.startTime}–{s.endTime}
                          </div>
                        </TableCell>
                        <TableCell>{duration(s.durationMinutes)}</TableCell>
                        <TableCell className="capitalize">
                          {booking?.studentName || "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {personName(s.mentorId)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {booking?.selectedClass?.class_id?.class || "—"}
                          {s.subjectName ? ` · ${s.subjectName}` : ""}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                          {s.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-block rounded-md px-2 py-1 text-xs font-semibold",
                              meta.cls,
                            )}
                          >
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === "logged" ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={verify.isPending}
                                onClick={() => verify.mutate(s._id)}
                              >
                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                Verify
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReason("");
                                  setRejecting(s);
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <PaginationControl
          currentPage={page}
          totalPages={data?.pagination?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this session</DialogTitle>
            <DialogDescription>
              The mentor will be notified. A short reason is optional.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)…"
            className="resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() =>
                rejecting &&
                reject.mutate(
                  { sessionId: rejecting._id, reason: reason.trim() || undefined },
                  { onSuccess: () => setRejecting(null) },
                )
              }
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSessionsPage;
