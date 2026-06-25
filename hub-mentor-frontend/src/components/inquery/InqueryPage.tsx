import React, { useState } from "react";
import DashboardLayout from "../dashboard/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useGetInqueryQuery } from "@/api/form-query/get-inquery";
import PaginationControl from "../ui/PaginationController";
import { handleOpenModal } from "@/contexts/modal-state";

const InqueryPage = () => {
  const [page, setPage] = useState(1);
  const limit = 5;
  

  const { data, isLoading, isError, error, isSuccess } = useGetInqueryQuery({
    page,
    limit,
  });

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  

  return (
    <DashboardLayout userRole={"admin"}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Inquiries</h2>
          <p className="text-sm text-gray-500">
            View and manage customer inquiries
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
              <span className="ml-2 text-gray-600">Loading inquiries...</span>
            </div>
          )}

          {isError && (
            <div className="p-6 text-red-600 text-center">
              Error loading inquiries: {error?.message || "Unknown error"}
            </div>
          )}

          {isSuccess && data?.data?.length === 0 && (
            <div className="p-6 text-gray-500 text-center">
              No inquiries found.
            </div>
          )}

          {isSuccess && data?.data?.length > 0 && (
            <>
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="px-4 py-3">#</TableHead>
                    <TableHead className="px-4 py-3">Student Name</TableHead>
                    <TableHead className="px-4 py-3">Subject</TableHead>
                    <TableHead className="px-4 py-3">Phone Number</TableHead>
                    <TableHead className="px-4 py-3">Status</TableHead>
                    <TableHead className="px-4 py-3 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="bg-white divide-y divide-gray-100">
                  {data.data.map((inquiry, index) => (
                    <TableRow key={inquiry._id} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {inquiry.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3 truncate max-w-[150px]">
                        {inquiry.subject || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {inquiry.phoneNumber || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            inquiry.status === "PENDING"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {inquiry.status || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button onClick={()=>handleOpenModal("status", inquiry._id)} variant="ghost" size="sm">
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InqueryPage;
