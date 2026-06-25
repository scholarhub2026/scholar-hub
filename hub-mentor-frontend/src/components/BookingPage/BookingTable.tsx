import { useEffect, useState } from "react";
import { Pencil, ReceiptIndianRupee } from "lucide-react";
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
import { store } from "@/contexts/store";
import { handleOpenModal } from "@/contexts/modal-state";
import { useCreatePaymentLinkMutation } from "@/api/booking/create-payment-link";
import { Button } from "../ui/button";
import { makePayment } from "@/lib/payment-gateway";

const BookingTable = () => {
  const studentId = store.getLoggedUser().id;
  const userType = store.getUserRole();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search); // 👈 debounced value
  const limit = 5;

  const user = {
    isStudent: userType === "student",
    isMentor: userType === "mentor",
    isAdmin: userType === "admin",
  };

  // 🕒 Debounce logic (wait 500ms after typing stops)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, [search]);

  // 🔥 Fetch only when debouncedSearch changes
  const { data, isLoading, isError, error } = useBookingsQuery({
    studentId,
    page,
    limit,
    search: debouncedSearch,
  });
  const { mutate: createLink } = useCreatePaymentLinkMutation();

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

  console.log(bookings);

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow-md overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bookings</h2>

          {/* 🔍 Search box */}
          <input
            type="text"
            placeholder="Search by student or mentor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // reset to first page when searching
            }}
            className="border border-gray-300 rounded-md px-3 py-2 w-64"
          />
        </div>

        {/* Table Content */}
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : isError ? (
          <p className="text-red-600">Error: {error?.message}</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <>
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-100">
                <TableRow className="text-center">
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>
                    {user.isStudent || user.isMentor ? "Amount" : "Phone"}
                  </TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {bookings.map((booking, i) => (
                  <TableRow
                    className="text-center"
                    key={booking._id}
                    // onClick={() => handleEdit(booking)}
                  >
                    <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                    <TableCell className="capitalize">
                      {booking.studentName || "—"}
                    </TableCell>
                    <TableCell>{booking.mentorId?.firstName || "—"}</TableCell>
                    <TableCell>
                      {user.isStudent || user.isMentor ? (
                        <span className="font-medium">
                          ₹ {booking.totalAmount || "0"}
                        </span>
                      ) : (
                        <a
                          href={`https://wa.me/${booking.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {booking.phone}
                        </a>
                      )}
                    </TableCell>

                    <TableCell>
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${
                          booking.bookingStatus === "completed"
                            ? "text-green-600"
                            : booking.bookingStatus === "cancelled"
                            ? "text-red-600"
                            : "text-yellow-600"
                        } font-medium capitalize`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = booking?.paymentStatus?.toLowerCase();

                        if (!status || status === "pending") {
                          return (
                            <span className="text-yellow-600 font-medium">
                              Pending
                            </span>
                          );
                        }

                        switch (status) {
                          case "completed":
                            return (
                              <span className="text-green-600 font-medium">
                                Paid
                              </span>
                            );
                          case "failed":
                            return (
                              <span className="text-red-600 font-medium">
                                Failed
                              </span>
                            );
                          default:
                            return (
                              <span className="text-gray-600 capitalize">
                                {booking.paymentStatus || "Unknown"}
                              </span>
                            );
                        }
                      })()}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      {user.isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(booking)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => createPaymentLink(booking)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Create Payment Link"
                          >
                            Create Payment Link
                          </button>
                        </>
                      )}
                      {user.isStudent &&
                         <Button disabled={booking.paymentStatus?.toLowerCase() ===
                          "paid"} onClick={()=>makePayment({
                            totalAmount:booking.totalAmount,
                            orderId:booking._id,
                            studentName:booking?.studentName,
                            email:booking.email,
                            contact:booking.phone

                          })}>Make Payment</Button>}

                      {user.isMentor && <div className="flex  justify-end gap-3">
                        <Button onClick={()=>handleOpenModal('student-log',{
                          type:"log",
                          id:booking._id
                        })}>View Logs</Button>
                        <Button onClick={()=>handleOpenModal('student-log',{
                          type:"view",
                          id:booking._id
                        })}>Make Log</Button></div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4">
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
