import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CalendarPlus, Phone } from "lucide-react";
import {
  useEnquiriesQuery,
  useUpdateEnquiryStatusMutation,
  useAdminCreateBookingMutation,
  type EnquiryRecord,
  type EnquiryScope,
  type EnquiryStatus,
} from "@/api/enquiry/enquiry-api";

const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_META: Record<EnquiryStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-amber-50 text-amber-600" },
  contacted: { label: "Contacted", cls: "bg-blue-50 text-blue-600" },
  converted: { label: "Converted", cls: "bg-emerald-50 text-emerald-600" },
  closed: { label: "Closed", cls: "bg-slate-100 text-slate-500" },
};

const SCOPES: Array<{ key: EnquiryScope; label: string; count?: EnquiryStatus }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New", count: "new" },
  { key: "contacted", label: "Contacted", count: "contacted" },
  { key: "converted", label: "Converted", count: "converted" },
  { key: "closed", label: "Closed", count: "closed" },
];

const AdminEnquiriesPage = () => {
  const [scope, setScope] = useState<EnquiryScope>("new");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useEnquiriesQuery({
    scope,
    page,
    limit: 10,
    search: debounced || undefined,
  });
  const enquiries = data?.enquiries ?? [];
  const counts = data?.counts;

  const updateStatus = useUpdateEnquiryStatusMutation();
  const createBooking = useAdminCreateBookingMutation();

  // Create-booking dialog
  const [creating, setCreating] = useState<EnquiryRecord | null>(null);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState(todayKey());

  const openCreate = (e: EnquiryRecord) => {
    setAmount(String(e.estimatedAmount || ""));
    setFrequency("monthly");
    setStartDate(todayKey());
    setCreating(e);
  };

  const submitCreate = () => {
    if (!creating) return;
    createBooking.mutate(
      {
        enquiryId: creating._id,
        studentName: creating.studentName,
        email: creating.email,
        phone: creating.phone,
        mentorId: creating.mentorId,
        classId: creating.classId ?? undefined,
        className: creating.className,
        selectedSyllabus: creating.selectedSyllabus,
        subjects: creating.subjects,
        bookingType: creating.enquiryType,
        totalAmount: Number(amount) || 0,
        paymentFrequency: frequency,
        classStartDate: startDate,
      },
      { onSuccess: () => setCreating(null) },
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
          <h1 className="text-2xl font-bold">Enquiries</h1>
          <p className="text-sm text-muted-foreground">
            Class enquiries from students. Contact them, then create the booking.
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
                {s.count && badge(counts?.[s.count])}
              </button>
            ))}
          </div>
          <Input
            className="max-w-xs"
            placeholder="Search student, phone, mentor…"
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
                Failed to load enquiries.
              </div>
            ) : enquiries.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No enquiries in this view.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Class / Subjects</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((e) => {
                    const meta = STATUS_META[e.status];
                    return (
                      <TableRow key={e._id}>
                        <TableCell>
                          <div className="font-medium capitalize">
                            {e.studentName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {e.phone}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{e.mentorName || "—"}</TableCell>
                        <TableCell>
                          <div className="capitalize">
                            {e.enquiryType === "demo"
                              ? "Demo class"
                              : e.className || "—"}
                          </div>
                          {e.enquiryType === "subject-wise" && (
                            <div className="text-xs text-muted-foreground">
                              {e.subjects.map((s) => s.name).join(", ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {e.estimatedAmount > 0 ? `₹${e.estimatedAmount}` : "Free"}
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
                          <div className="flex justify-end gap-1">
                            {e.status !== "converted" && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => openCreate(e)}
                              >
                                <CalendarPlus className="mr-1.5 h-4 w-4" />
                                Create booking
                              </Button>
                            )}
                            {e.status === "new" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: e._id,
                                    status: "contacted",
                                  })
                                }
                              >
                                Mark contacted
                              </Button>
                            )}
                            {e.status !== "closed" && e.status !== "converted" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStatus.mutate({ id: e._id, status: "closed" })
                                }
                              >
                                Close
                              </Button>
                            )}
                          </div>
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

      {/* Create-booking dialog */}
      <Dialog open={!!creating} onOpenChange={(open) => !open && setCreating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create booking</DialogTitle>
            <DialogDescription>
              {creating
                ? `Confirm ${creating.studentName}'s classes with ${creating.mentorName}. Set the fee, frequency and start date — payment is collected manually.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amt">Fee amount (₹ per period)</Label>
              <Input
                id="amt"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as "weekly" | "monthly")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Class start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={createBooking.isPending}
              onClick={submitCreate}
            >
              Create booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminEnquiriesPage;
