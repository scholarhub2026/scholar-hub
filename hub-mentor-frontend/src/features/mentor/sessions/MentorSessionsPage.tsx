import { useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, CalendarPlus } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useBookingsQuery } from "@/api/booking/getBookings";
import {
  useSessionsQuery,
  useLogSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  type SessionRecord,
  type SessionStatus,
} from "@/api/sessions/sessions-api";

const todayKey = () => new Date().toISOString().slice(0, 10);

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
  logged: { label: "Awaiting verification", cls: "bg-amber-50 text-amber-600" },
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
};

const SCOPES: Array<{ key: SessionStatus | ""; label: string }> = [
  { key: "", label: "All" },
  { key: "logged", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
];

type ClassSubject = {
  subject_id?: { _id?: string; name?: string } | string;
};
type ConfirmedBooking = {
  _id: string;
  bookingStatus?: string;
  bookingType?: string;
  studentName?: string;
  selectedSubjects?: string[];
  selectedClass?: { class_id?: { class?: string }; subject?: ClassSubject[] };
};

type FormState = {
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  bookingId: "",
  date: todayKey(),
  startTime: "18:00",
  endTime: "19:00",
  subjectId: "",
  notes: "",
});

const MentorSessionsPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SessionStatus | "">("logged");
  const [page, setPage] = useState(1);

  const { data: bookingsData } = useBookingsQuery({
    studentId: user?.id,
    limit: 100,
  });
  const confirmedBookings = useMemo(
    () =>
      ((bookingsData?.bookings ?? []) as ConfirmedBooking[]).filter(
        (b) => b.bookingStatus === "confirmed",
      ),
    [bookingsData],
  );

  const { data, isLoading, isError } = useSessionsQuery({
    status: status || undefined,
    page,
    limit: 20,
  });
  const sessions = data?.sessions ?? [];

  const logSession = useLogSessionMutation();
  const updateSession = useUpdateSessionMutation();
  const deleteSession = useDeleteSessionMutation();

  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState<SessionRecord | null>(null);
  const [deleting, setDeleting] = useState<SessionRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const selectedBooking = useMemo(
    () => confirmedBookings.find((b) => b._id === form.bookingId),
    [confirmedBookings, form.bookingId],
  );
  const needsSubject = selectedBooking?.bookingType === "multiple";
  const subjectOptions = useMemo(() => {
    if (!needsSubject) return [];
    const allowed = (selectedBooking?.selectedSubjects ?? []).map(String);
    return (selectedBooking?.selectedClass?.subject ?? [])
      .map((s) => {
        const ref = s.subject_id;
        const isObj = ref && typeof ref === "object";
        return {
          id: String(isObj ? (ref._id ?? "") : ref ?? ""),
          name: (isObj ? ref.name : undefined) ?? "Subject",
        };
      })
      .filter((s) => allowed.includes(s.id));
  }, [needsSubject, selectedBooking]);

  const openLog = () => {
    setForm(emptyForm());
    setLogging(true);
  };
  const openEdit = (s: SessionRecord) => {
    setForm({
      bookingId: typeof s.bookingId === "string" ? s.bookingId : s.bookingId._id,
      date: s.date.slice(0, 10),
      startTime: s.startTime,
      endTime: s.endTime,
      subjectId: s.subjectId ?? "",
      notes: s.notes ?? "",
    });
    setEditing(s);
  };

  const submitLog = () => {
    logSession.mutate(
      {
        bookingId: form.bookingId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        subjectId: needsSubject ? form.subjectId : undefined,
        notes: form.notes.trim() || undefined,
      },
      { onSuccess: () => setLogging(false) },
    );
  };
  const submitEdit = () => {
    if (!editing) return;
    updateSession.mutate(
      {
        sessionId: editing._id,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes.trim() || undefined,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const canSubmitLog =
    form.bookingId &&
    form.date &&
    form.startTime &&
    form.endTime &&
    form.endTime > form.startTime &&
    (!needsSubject || form.subjectId);

  const studentOf = (s: SessionRecord) =>
    typeof s.bookingId === "object" ? s.bookingId.studentName : "—";

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Class sessions</h1>
            <p className="text-sm text-muted-foreground">
              Log completed classes — verified sessions are billed to the student.
            </p>
          </div>
          <Button onClick={openLog}>
            <Plus className="mr-1.5 h-4 w-4" /> Log session
          </Button>
        </div>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {SCOPES.map((s) => (
            <button
              key={s.key || "all"}
              type="button"
              onClick={() => {
                setStatus(s.key);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                status === s.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {s.label}
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
                No sessions logged yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => {
                    const meta = STATUS_META[s.status];
                    return (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="font-medium">{fmtDate(s.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.startTime}–{s.endTime}
                          </div>
                        </TableCell>
                        <TableCell>{duration(s.durationMinutes)}</TableCell>
                        <TableCell className="capitalize">{studentOf(s)}</TableCell>
                        <TableCell className="capitalize">
                          {s.subjectName || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={cn(
                                "inline-block rounded-md px-2 py-1 text-xs font-semibold",
                                meta.cls,
                              )}
                            >
                              {meta.label}
                            </span>
                            {s.status === "rejected" && s.rejectReason && (
                              <span className="text-[11px] text-muted-foreground">
                                {s.rejectReason}
                              </span>
                            )}
                            {s.invoiceId && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                                Billed
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === "logged" ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(s)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleting(s)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
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
      </div>

      {/* Log / edit session dialog */}
      <Dialog
        open={logging || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setLogging(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit session" : "Log a class session"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the session details."
                : "Record a completed class. An admin verifies it before it's billed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Booking</Label>
                <Select
                  value={form.bookingId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, bookingId: v, subjectId: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a confirmed booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {confirmedBookings.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No confirmed bookings.
                      </div>
                    ) : (
                      confirmedBookings.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          {b.studentName} — {b.selectedClass?.class_id?.class ?? "class"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                max={todayKey()}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>
            </div>

            {!editing && needsSubject && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={form.subjectId || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, subjectId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the subject taught" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="capitalize">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                className="resize-none"
                placeholder="e.g. topics covered…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLogging(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            {editing ? (
              <Button
                disabled={updateSession.isPending || form.endTime <= form.startTime}
                onClick={submitEdit}
              >
                Save changes
              </Button>
            ) : (
              <Button disabled={!canSubmitLog || logSession.isPending} onClick={submitLog}>
                <CalendarPlus className="mr-1.5 h-4 w-4" />
                Log session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this session?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteSession.isPending}
              onClick={() =>
                deleting &&
                deleteSession.mutate(deleting._id, {
                  onSuccess: () => setDeleting(null),
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MentorSessionsPage;
