import { useEffect, useState } from "react";
import { Pencil, Check, X, CalendarX, Search, Trash2 } from "lucide-react";
import DashboardLayout from "../dashboard/DashboardLayout";
import PaginationControl from "../ui/PaginationController";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBookingsQuery } from "@/api/booking/getBookings";
import { useAuth } from "@/auth/AuthProvider";
import { roleSlug } from "@/config/roles";
import { handleOpenModal } from "@/contexts/modal-state";
import {
  useApproveBookingMutation,
  useRejectBookingMutation,
} from "@/api/booking/moderate-booking";
import { useDeleteBookingMutation } from "@/api/booking/delete-booking";
import { useCancelBookingMutation } from "@/api/booking/cancel-booking";
import {
  useCompleteBookingMutation,
  useCloseBookingMutation,
} from "@/api/booking/lifecycle-api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

const HEAD = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500";

const PAYMENT_LABEL: Record<string, string> = {
  completed: "paid",
};

const FREQ_SHORT: Record<string, string> = {
  daily: "day",
  weekly: "wk",
  monthly: "mo",
};

/** "₹500/mo · Due 16 Aug" payment cell for confirmed manual-collection bookings. */
const PaymentCell = ({ booking }) => {
  if (booking.bookingStatus === "confirmed" && booking.nextDueDate) {
    const due = new Date(booking.nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueDays = Math.max(
      0,
      Math.round((today.getTime() - due.getTime()) / 86_400_000),
    );
    const dueLabel = due.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    });
    return (
      <div className="text-sm">
        <div className="font-semibold text-slate-800">
          ₹{booking.totalAmount}/{FREQ_SHORT[booking.paymentFrequency] ?? "mo"}
        </div>
        <div
          className={
            overdueDays > 0
              ? "font-medium text-red-600"
              : due.getTime() === today.getTime()
                ? "font-medium text-amber-600"
                : "text-slate-500"
          }
        >
          {overdueDays > 0 ? `Overdue ${overdueDays}d` : `Due ${dueLabel}`}
        </div>
      </div>
    );
  }
  // Legacy / pending / cancelled rows keep the status badge.
  return (
    <StatusBadge
      status={
        booking.totalAmount > 0
          ? (PAYMENT_LABEL[booking.paymentStatus?.toLowerCase()] ??
            (booking.paymentStatus || "pending"))
          : "free"
      }
    />
  );
};

const BookingTable = () => {
  const { user: authUser } = useAuth();
  const studentId = authUser?.id ?? "";
  const userType = roleSlug(authUser?.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const limit = 5;

  const user = {
    isStudent: userType === "student",
    isMentor: userType === "mentor",
    isAdmin: userType === "admin",
  };

  // Debounce search (500ms after typing stops)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error } = useBookingsQuery({
    studentId,
    page,
    limit,
    search: debouncedSearch,
  });
  const { mutate: approveBooking, isPending: isApproving } =
    useApproveBookingMutation();
  const { mutate: rejectBooking, isPending: isRejecting } =
    useRejectBookingMutation();
  const { mutate: deleteBooking, isPending: isDeleting } =
    useDeleteBookingMutation();

  const handleDelete = (booking) => {
    if (
      window.confirm(
        `Delete this booking for ${booking.studentName || "this student"}? This can't be undone.`,
      )
    ) {
      deleteBooking(booking._id);
    }
  };

  const { mutate: cancelBooking, isPending: isCancelling } =
    useCancelBookingMutation();
  const { mutate: completeBooking, isPending: isCompleting } =
    useCompleteBookingMutation();
  const { mutate: closeBooking, isPending: isClosing } =
    useCloseBookingMutation();

  const handleComplete = (booking) => {
    if (
      window.confirm(
        "Are classes over for this booking? This raises the final invoice for any unbilled sessions.",
      )
    ) {
      completeBooking(booking._id);
    }
  };

  const handleClose = (booking) => {
    if (
      window.confirm(
        "Close this booking? Only allowed once every invoice has been settled.",
      )
    ) {
      closeBooking(booking._id);
    }
  };

  const handleCancel = (booking) => {
    if (
      window.confirm("Cancel this booking? You can book it again afterwards.")
    ) {
      cancelBooking(booking._id);
    }
  };

  // Student's action for a row: no online payment anymore — bookings await
  // admin approval, and fees are collected in person per period.
  const renderStudentAction = (booking) => {
    const status = booking.bookingStatus?.toLowerCase();

    if (status === "cancelled") {
      return <span className="text-sm text-slate-400">Cancelled</span>;
    }
    return (
      <div className="flex items-center justify-end gap-2">
        {status === "pending" && (
          <span className="text-sm text-amber-600">Awaiting approval</span>
        )}
        {status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            disabled={isCancelling}
            onClick={() => handleCancel(booking)}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination?.totalPages || 1;

  const handleEdit = (booking) => {
    handleOpenModal("edit-booking", { booking });
  };

  const handleApprove = (booking) => {
    if (
      window.confirm(
        `Approve ${booking.studentName || "this student"}'s booking? The student and mentor will be notified and the payment schedule starts.`,
      )
    ) {
      approveBooking(booking._id);
    }
  };

  const handleReject = (booking) => {
    const reason = window.prompt(
      "Reason for rejection (optional — shared with the student):",
      "",
    );
    if (reason === null) return; // dismissed
    rejectBooking({ bookingId: booking._id, reason: reason.trim() || undefined });
  };

  const title = user.isMentor ? "Schedule" : user.isStudent ? "My Bookings" : "Bookings";

  return (
    <DashboardLayout>
      <PageHeader
        title={title}
        description={
          user.isAdmin
            ? "All bookings across the platform."
            : user.isMentor
              ? "Your confirmed sessions."
              : "Your session bookings and payments."
        }
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search student or mentor…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-64 pl-9"
            />
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error: {error?.message}</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-400">
            <CalendarX className="h-8 w-8" />
            <p className="text-sm">No bookings found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className={HEAD}>#</TableHead>
                    <TableHead className={HEAD}>Student</TableHead>
                    <TableHead className={HEAD}>Mentor</TableHead>
                    <TableHead className={HEAD}>
                      {user.isStudent || user.isMentor ? "Amount" : "Phone"}
                    </TableHead>
                    <TableHead className={HEAD}>Date</TableHead>
                    <TableHead className={HEAD}>Status</TableHead>
                    <TableHead className={HEAD}>Payment</TableHead>
                    <TableHead className={`${HEAD} text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {bookings.map((booking, i) => (
                    <TableRow
                      key={booking._id}
                      className="border-slate-100 transition-colors hover:bg-slate-50/60"
                    >
                      <TableCell className="px-4 text-slate-400">
                        {(page - 1) * limit + i + 1}
                      </TableCell>
                      <TableCell className="px-4 font-medium capitalize text-slate-800">
                        {booking.studentName || "—"}
                      </TableCell>
                      <TableCell className="px-4 capitalize text-slate-600">
                        {booking.mentorId?.firstName || "—"}
                      </TableCell>
                      <TableCell className="px-4">
                        {user.isStudent || user.isMentor ? (
                          <span className="font-semibold text-slate-800">
                            {booking.totalAmount > 0
                              ? `₹${booking.totalAmount}`
                              : "Free"}
                          </span>
                        ) : (
                          <a
                            href={`https://wa.me/${booking.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {booking.phone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="px-4 text-slate-600">
                        {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusBadge
                          status={booking.bookingStatus}
                          label={
                            booking.bookingStatus === "approved"
                              ? "Awaiting teacher"
                              : undefined
                          }
                        />
                      </TableCell>
                      <TableCell className="px-4">
                        <PaymentCell booking={booking} />
                      </TableCell>

                      <TableCell className="px-4 text-right">
                        {user.isAdmin && (
                          <div className="flex justify-end gap-1">
                            {booking.bookingStatus === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleApprove(booking)}
                                  disabled={isApproving || isRejecting}
                                  title="Approve — notifies student & mentor"
                                >
                                  <Check className="mr-1.5 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReject(booking)}
                                  disabled={isApproving || isRejecting}
                                  title="Reject with an optional reason"
                                >
                                  <X className="mr-1.5 h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {booking.bookingStatus === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleComplete(booking)}
                                disabled={isCompleting}
                                title="Classes over — raise the final invoice"
                              >
                                <Check className="mr-1.5 h-4 w-4" />
                                Complete
                              </Button>
                            )}
                            {booking.bookingStatus === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClose(booking)}
                                disabled={isClosing}
                                title="Close once all invoices are settled"
                              >
                                Close
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-primary"
                              onClick={() => handleEdit(booking)}
                            >
                              <Pencil className="mr-1.5 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-red-600"
                              onClick={() => handleDelete(booking)}
                              disabled={isDeleting}
                              title="Delete this booking"
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        )}

                        {user.isStudent && renderStudentAction(booking)}

                        {user.isMentor && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOpenModal("student-log", {
                                  type: "log",
                                  id: booking._id,
                                })
                              }
                            >
                              View Logs
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleOpenModal("student-log", {
                                  type: "view",
                                  id: booking._id,
                                })
                              }
                            >
                              Make Log
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-slate-100 px-4">
              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookingTable;
