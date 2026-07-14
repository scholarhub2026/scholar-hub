import { useState } from "react";
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
import { Pencil, Inbox } from "lucide-react";
import { useGetInqueryQuery } from "@/api/form-query/get-inquery";
import PaginationControl from "../ui/PaginationController";
import { handleOpenModal } from "@/contexts/modal-state";
import { Skeleton } from "../ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

const HEAD = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500";

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
    <DashboardLayout userRole="admin">
      <PageHeader
        title="Enquiries"
        description="View and manage incoming student enquiries."
      />

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Error loading enquiries: {error?.message || "Unknown error"}
          </div>
        ) : isSuccess && (data?.data?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-400">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">No enquiries found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className={HEAD}>#</TableHead>
                    <TableHead className={HEAD}>Student</TableHead>
                    <TableHead className={HEAD}>Subject</TableHead>
                    <TableHead className={HEAD}>Phone</TableHead>
                    <TableHead className={HEAD}>Status</TableHead>
                    <TableHead className={`${HEAD} text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.data.map((inquiry, index) => (
                    <TableRow
                      key={inquiry._id}
                      className="border-slate-100 transition-colors hover:bg-slate-50/60"
                    >
                      <TableCell className="px-4 text-slate-400">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="px-4 font-medium capitalize text-slate-800">
                        {inquiry.name || "—"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate px-4 text-slate-600">
                        {inquiry.subject || "—"}
                      </TableCell>
                      <TableCell className="px-4 text-slate-600">
                        {inquiry.phoneNumber || "—"}
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusBadge status={inquiry.status} />
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Button
                          onClick={() => handleOpenModal("status", inquiry._id)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-primary"
                        >
                          <Pencil className="mr-1.5 h-4 w-4" />
                          Update
                        </Button>
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

export default InqueryPage;
