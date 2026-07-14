import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Layers } from "lucide-react";
import { useGetClassesQuery } from "@/api/class/get-classess";
import { useDeleteClassMutation } from "@/api/class/delete-class";
import PaginationControl from "../ui/PaginationController";
import StatusBadge from "@/components/shared/StatusBadge";

const HEAD = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500";

const ClassManagement = ({ setEditId }) => {
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading, isError, error } = useGetClassesQuery({ page, limit });
  const { mutate: deleteClass } = useDeleteClassMutation();

  const classes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-slate-900">Class List</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-500">Error: {error?.message}</div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <Layers className="h-7 w-7" />
          <p className="text-sm">No classes yet. Add one on the left.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className={HEAD}>#</TableHead>
                  <TableHead className={HEAD}>Class</TableHead>
                  <TableHead className={HEAD}>Syllabus</TableHead>
                  <TableHead className={HEAD}>Subjects</TableHead>
                  <TableHead className={HEAD}>Price</TableHead>
                  <TableHead className={HEAD}>Status</TableHead>
                  <TableHead className={`${HEAD} text-right`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls, i) => (
                  <TableRow
                    key={cls._id}
                    className="border-slate-100 transition-colors hover:bg-slate-50/60"
                  >
                    <TableCell className="px-4 text-slate-400">
                      {(page - 1) * limit + i + 1}
                    </TableCell>
                    <TableCell className="px-4 font-medium text-slate-800">
                      {cls?.class}
                    </TableCell>
                    <TableCell className="px-4 text-slate-600">{cls?.syllabus}</TableCell>
                    <TableCell className="px-4 text-slate-600">
                      {cls?.subjects?.length ?? 0}
                    </TableCell>
                    <TableCell className="px-4 font-medium text-slate-800">
                      ₹{cls?.basePrice}
                    </TableCell>
                    <TableCell className="px-4">
                      <StatusBadge status={cls?.isActive ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-primary"
                          onClick={() => setEditId(cls._id)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            if (confirm("Delete this class?")) deleteClass(cls._id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
  );
};

export default ClassManagement;
