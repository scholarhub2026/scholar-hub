import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import PaginationControl from "@/components/ui/PaginationController";
import { cn } from "@/lib/utils";
import { CheckCircle2, History, IndianRupee, Mail, FileText } from "lucide-react";
import {
  personName,
  useGetDuePaymentsQuery,
  useRecordPaymentMutation,
  type DueBooking,
  type PaymentScope,
} from "@/api/admin/payments-api";
import {
  useInvoicesQuery,
  useInvoiceDetailQuery,
  useRecordInvoicePaymentMutation,
  useResendReceiptMutation,
  useVoidInvoiceMutation,
  type InvoiceRecord,
  type InvoiceScope,
} from "@/api/invoices/invoices-api";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const money = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

/* ───────────────────────── Invoices tab (billing v2) ───────────────────── */

const INV_SCOPES: Array<{ key: InvoiceScope; label: string; countKey?: "due" | "paid" | "settled" }> = [
  { key: "all", label: "All" },
  { key: "due", label: "Due", countKey: "due" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid", countKey: "paid" },
  { key: "settled", label: "Settled", countKey: "settled" },
];

const InvoiceStatusChip = ({ inv }: { inv: InvoiceRecord }) => {
  if (inv.status === "payment_due") {
    const overdue = (inv.daysOverdue ?? 0) > 0;
    return (
      <span
        className={cn(
          "inline-block rounded-md px-2 py-1 text-xs font-semibold",
          overdue ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
        )}
      >
        {overdue ? `${inv.daysOverdue}d overdue` : "Due"}
      </span>
    );
  }
  const cls =
    inv.status === "paid"
      ? "bg-emerald-50 text-emerald-600"
      : inv.status === "settled"
        ? "bg-blue-50 text-blue-600"
        : "bg-slate-100 text-slate-500";
  const label =
    inv.status === "paid" ? "Paid" : inv.status === "settled" ? "Settled" : "Void";
  return (
    <span className={cn("inline-block rounded-md px-2 py-1 text-xs font-semibold", cls)}>
      {label}
    </span>
  );
};

const METHODS = ["cash", "upi", "bank-transfer", "other"] as const;

const InvoicesTab = () => {
  const [scope, setScope] = useState<InvoiceScope>("due");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useInvoicesQuery({
    scope,
    page,
    limit: 10,
    search: debounced || undefined,
  });
  const invoices = data?.invoices ?? [];
  const counts = data?.counts;

  const recordPayment = useRecordInvoicePaymentMutation();
  const resendReceipt = useResendReceiptMutation();
  const voidInvoice = useVoidInvoiceMutation();

  const [paying, setPaying] = useState<InvoiceRecord | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("cash");
  const [note, setNote] = useState("");
  const [voiding, setVoiding] = useState<InvoiceRecord | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const detailQuery = useInvoiceDetailQuery(detailId ?? undefined);

  const openPay = (inv: InvoiceRecord) => {
    setMethod("cash");
    setNote("");
    setPaying(inv);
  };

  const badge = (n?: number) =>
    n != null && n > 0 ? (
      <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
        {n}
      </span>
    ) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {INV_SCOPES.map((s) => (
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
              {s.countKey && badge(counts?.[s.countKey])}
            </button>
          ))}
        </div>
        <Input
          className="max-w-xs"
          placeholder="Search invoice #, student, mentor…"
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
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">
              Failed to load invoices.
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No invoices in this view.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setDetailId(inv._id)}
                        className="text-left font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {inv.periodLabel}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium capitalize">{inv.studentName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{inv.email}</div>
                    </TableCell>
                    <TableCell className="capitalize">{inv.mentorName || "—"}</TableCell>
                    <TableCell className="font-semibold">{money(inv.amount)}</TableCell>
                    <TableCell>
                      <InvoiceStatusChip inv={inv} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {inv.status === "payment_due" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => openPay(inv)}
                            >
                              <CheckCircle2 className="mr-1.5 h-4 w-4" />
                              Record payment
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Void invoice"
                              onClick={() => {
                                setVoidReason("");
                                setVoiding(inv);
                              }}
                            >
                              Void
                            </Button>
                          </>
                        )}
                        {inv.status === "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={resendReceipt.isPending}
                            onClick={() => resendReceipt.mutate(inv._id)}
                          >
                            <Mail className="mr-1.5 h-4 w-4" />
                            Resend receipt
                          </Button>
                        )}
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

      {/* Record payment dialog */}
      <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {paying
                ? `${paying.invoiceNumber} · ${money(paying.amount)} from ${paying.studentName}. A receipt is emailed to the student.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {paying && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              {paying.lineItems.map((li, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className="text-slate-600">{li.description}</span>
                  <span className="font-medium">{money(li.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-note">Note (optional)</Label>
              <Textarea
                id="inv-note"
                className="resize-none"
                placeholder="e.g. cash collected at office…"
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
              onClick={() =>
                paying &&
                recordPayment.mutate(
                  { invoiceId: paying._id, method, note: note.trim() || undefined },
                  { onSuccess: () => setPaying(null) },
                )
              }
            >
              Record & email receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void dialog */}
      <Dialog open={!!voiding} onOpenChange={(open) => !open && setVoiding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void this invoice?</DialogTitle>
            <DialogDescription>
              Its sessions are released so a corrected invoice can be generated.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)…"
            className="resize-none"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiding(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={voidInvoice.isPending}
              onClick={() =>
                voiding &&
                voidInvoice.mutate(
                  { invoiceId: voiding._id, reason: voidReason.trim() || undefined },
                  { onSuccess: () => setVoiding(null) },
                )
              }
            >
              Void invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice detail dialog */}
      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {detailQuery.data?.invoice.invoiceNumber ?? "Invoice"}
            </DialogTitle>
            <DialogDescription>
              {detailQuery.data
                ? `${detailQuery.data.invoice.studentName} · ${detailQuery.data.invoice.periodLabel}`
                : "Loading…"}
            </DialogDescription>
          </DialogHeader>
          {detailQuery.data && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailQuery.data.invoice.lineItems.map((li, i) => (
                    <TableRow key={i}>
                      <TableCell>{li.description}</TableCell>
                      <TableCell>
                        {li.quantity} {li.unit}
                        {li.quantity === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell>{money(li.rate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {money(li.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {money(detailQuery.data.invoice.amount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {detailQuery.data.payment && (
                <p className="text-xs text-muted-foreground">
                  Paid via {detailQuery.data.payment.method} ·{" "}
                  {detailQuery.data.payment.receiptNumber} ·{" "}
                  {fmtDate(detailQuery.data.payment.collectedAt)}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ─────────────────── Legacy flat-fee collection (pre-rework) ────────────── */

const FREQ_SHORT: Record<string, string> = {
  daily: "day",
  weekly: "wk",
  monthly: "mo",
};

const LegacyDueChip = ({ booking }: { booking: DueBooking }) => {
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

const LEGACY_SCOPES: Array<{ key: PaymentScope; label: string }> = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Due today" },
  { key: "upcoming", label: "Upcoming" },
];

const LegacyPaymentsTab = () => {
  const [scope, setScope] = useState<PaymentScope>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [paying, setPaying] = useState<DueBooking | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
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
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {LEGACY_SCOPES.map((s) => (
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
                    <TableCell className="capitalize">{personName(b.mentorId)}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{b.totalAmount}/{FREQ_SHORT[b.paymentFrequency] ?? "mo"}
                    </TableCell>
                    <TableCell>
                      <LegacyDueChip booking={b} />
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

      <Dialog open={!!history} onOpenChange={(open) => !open && setHistory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment history</DialogTitle>
            <DialogDescription>
              {history
                ? `${history.studentName} — ₹${history.totalAmount}/${FREQ_SHORT[history.paymentFrequency] ?? "mo"}`
                : ""}
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
    </>
  );
};

/* ──────────────────────────────── Page ─────────────────────────────────── */

const AdminPaymentsPage = () => {
  const [tab, setTab] = useState<"invoices" | "legacy">("invoices");

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">
              Collect fees against invoices raised from completed classes.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border bg-white p-1">
            {(["invoices", "legacy"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition",
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "invoices" ? <InvoicesTab /> : <LegacyPaymentsTab />}
      </div>
    </DashboardLayout>
  );
};

export default AdminPaymentsPage;
