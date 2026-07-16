import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { CheckCircle2, History, IndianRupee } from "lucide-react";
import {
  personName,
  useGetDuePaymentsQuery,
  useRecordPaymentMutation,
  type DueBooking,
  type PaymentScope,
} from "@/api/admin/payments-api";

const FREQ_SHORT: Record<string, string> = {
  daily: "day",
  weekly: "wk",
  monthly: "mo",
};

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const DueChip = ({ booking }: { booking: DueBooking }) => {
  const cls =
    booking.dueStatus === "overdue"
      ? "bg-red-50 text-red-600"
      : booking.dueStatus === "today"
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-600";
  const label =
    booking.dueStatus === "overdue"
      ? `${booking.daysOverdue}d overdue`
      : booking.dueStatus === "today"
        ? "Due today"
        : fmtDate(booking.nextDueDate);
  return (
    <span className={cn("inline-block rounded-md px-2 py-1 text-xs font-semibold", cls)}>
      {label}
    </span>
  );
};

const SCOPES: Array<{ key: PaymentScope; label: string }> = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Due today" },
  { key: "upcoming", label: "Upcoming" },
];

const AdminPaymentsPage = () => {
  const [scope, setScope] = useState<PaymentScope>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // Mark-paid dialog state
  const [paying, setPaying] = useState<DueBooking | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  // Payment-history dialog state
  const [history, setHistory] = useState<DueBooking | null>(null);

  const recordPayment = useRecordPaymentMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useGetDuePaymentsQuery({
    scope,
    page,
    limit: 10,
    search: debounced || undefined,
  });
  const bookings = data?.bookings ?? [];
  const counts = data?.counts;

  const openMarkPaid = (b: DueBooking) => {
    setPaying(b);
    setAmount(String(b.totalAmount ?? ""));
    setNote("");
  };

  const submitMarkPaid = () => {
    if (!paying) return;
    recordPayment.mutate(
      {
        bookingId: paying._id,
        amount: amount === "" ? undefined : Number(amount),
        note: note.trim() || undefined,
      },
      { onSuccess: () => setPaying(null) },
    );
  };

  const badge = (n?: number) =>
    n != null && n > 0 ? (
      <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
        {n}
      </span>
    ) : null;

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Fees to collect for confirmed bookings — collected manually after
            classes, per the booking's frequency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setScope(s.key);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition",
                  scope === s.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                {s.label}
                {s.key === "overdue" && badge(counts?.overdue)}
                {s.key === "today" && badge(counts?.today)}
                {s.key === "upcoming" && badge(counts?.upcoming)}
              </button>
            ))}
          </div>
          <Input
            className="max-w-xs"
            placeholder="Search student, email or phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                Failed to load payments.
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                Nothing due{scope !== "all" ? " in this view" : ""}. 🎉
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Next due</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell>
                        <div className="font-medium capitalize">{b.studentName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {personName(b.mentorId)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{b.totalAmount}/{FREQ_SHORT[b.paymentFrequency] ?? "mo"}
                      </TableCell>
                      <TableCell>
                        <DueChip booking={b} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.payments?.length ?? 0} payment
                        {(b.payments?.length ?? 0) === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openMarkPaid(b)}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Mark paid
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistory(b)}
                            title="Payment history"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Mark-paid dialog */}
      <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {paying
                ? `Collecting from ${paying.studentName} for the period due ${fmtDate(paying.nextDueDate)}. The next due date moves one ${paying.paymentFrequency === "daily" ? "day" : paying.paymentFrequency === "weekly" ? "week" : "month"} forward.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="pay-amount"
                  type="number"
                  min={0}
                  className="pl-9"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-note">Note (optional)</Label>
              <Textarea
                id="pay-note"
                placeholder="e.g. cash, UPI to admin, partial…"
                className="resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={recordPayment.isPending}
              onClick={submitMarkPaid}
            >
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment-history dialog */}
      <Dialog open={!!history} onOpenChange={(open) => !open && setHistory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment history</DialogTitle>
            <DialogDescription>
              {history ? `${history.studentName} — ₹${history.totalAmount}/${FREQ_SHORT[history.paymentFrequency] ?? "mo"}` : ""}
            </DialogDescription>
          </DialogHeader>
          {history && (history.payments?.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {history?.payments
                ?.slice()
                .reverse()
                .map((p, i) => (
                  <div
                    key={p._id ?? i}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-800">
                        {p.periodLabel || fmtDate(p.collectedAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDate(p.collectedAt)}
                        {p.note ? ` · ${p.note}` : ""}
                      </div>
                    </div>
                    <div className="font-semibold text-emerald-600">₹{p.amount}</div>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPaymentsPage;
