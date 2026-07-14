import { useEffect, useState } from "react";
import { Pencil, Link2, CalendarX, Search, Trash2 } from "lucide-react";
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
import { useCreatePaymentLinkMutation } from "@/api/booking/create-payment-link";
import { useUpdateBookingMutation } from "@/api/booking/update-booking";
import { useDeleteBookingMutation } from "@/api/booking/delete-booking";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { makePayment } from "@/lib/payment-gateway";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

const HEAD = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500";

const PAYMENT_LABEL: Record<string, string> = {
  completed: "paid",
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
  const { mutate: createLink } = useCreatePaymentLinkMutation();
  const { mutate: updateBooking } = useUpdateBookingMutation();
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

  // Open Razorpay for an existing (pending) booking, then mark it paid on success.
  const payForBooking = (booking) => {
    makePayment({
      totalAmount: booking.totalAmount,
      orderId: booking._id,
      bookingId: booking._id,
      studentName: booking?.studentName,
      email: booking.email,
      phone: booking.phone,
      onSuccess: (rp) => {
        updateBooking({
          bookingId: booking._id,
          updateData: {
            paymentStatus: "completed",
            bookingStatus: "confirmed",
            transactionId: rp.razorpay_payment_id,
          },
        });
      },
    });
  };

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination?.totalPages || 1;

  const handleEdit = (booking) => {
    handleOpenModal("edit-booking", { booking });
  };

  const createPaymentLink = (booking) => {
    createLink({
      amount: booking.totalAmount,
      name: booking?.studentName,
      email: booking.studentId?.email,
      contact: booking.phone,
      orderId: booking._id,
    });
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
                        <StatusBadge status={booking.bookingStatus} />
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusBadge
                          status={
                            booking.totalAmount > 0
                              ? (PAYMENT_LABEL[
                                  booking.paymentStatus?.toLowerCase()
                                ] ??
                                (booking.paymentStatus || "pending"))
                              : "free"
                          }
                        />
                      </TableCell>

                      <TableCell className="px-4 text-right">
                        {user.isAdmin && (
                          <div className="flex justify-end gap-1">
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
                              className="text-slate-500 hover:text-primary"
                              onClick={() => createPaymentLink(booking)}
                              title="Send a Razorpay payment link"
                            >
                              <Link2 className="mr-1.5 h-4 w-4" />
                              Payment Link
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

                        {user.isStudent &&
                          (booking.totalAmount < 1 ? (
                            <span className="text-sm text-slate-400">
                              No payment due
                            </span>
                          ) : booking.paymentStatus?.toLowerCase() ===
                              "completed" ||
                            booking.paymentStatus?.toLowerCase() === "paid" ? (
                            <span className="text-sm font-medium text-emerald-600">
                              Paid
                            </span>
                          ) : (
                            <Button size="sm" onClick={() => payForBooking(booking)}>
                              Make Payment
                            </Button>
                          ))}

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
