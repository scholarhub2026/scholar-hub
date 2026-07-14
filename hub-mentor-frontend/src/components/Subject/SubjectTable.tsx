import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Pencil, BookOpen } from "lucide-react";
import { useGetSubjectQuery } from "@/api/subject/get-subject";
import PaginationControl from "../ui/PaginationController";
import StatusBadge from "@/components/shared/StatusBadge";

const HEAD = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500";

const SubjectTable = ({ setValue }) => {
  const [page, setPage] = useState(1);
  const limit = 5;
  const { data: subjects, isLoading } = useGetSubjectQuery({
    subjectType: "subject",
    page,
    limit,
  });

  const rows = subjects?.data || [];
  const total = subjects?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleEdit = (subject) => {
    setValue("isActive", subject.isActive);
    setValue("subject", subject.name);
    setValue("subjectId", subject._id);
    setValue("isEdit", true);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-slate-900">Subject List</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <BookOpen className="h-7 w-7" />
          <p className="text-sm">No subjects yet. Add one on the left.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className={HEAD}>#</TableHead>
                  <TableHead className={HEAD}>Subject</TableHead>
                  <TableHead className={HEAD}>Status</TableHead>
                  <TableHead className={`${HEAD} text-right`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((cls, i) => (
                  <TableRow
                    key={cls._id}
                    className="border-slate-100 transition-colors hover:bg-slate-50/60"
                  >
                    <TableCell className="px-4 text-slate-400">
                      {(page - 1) * limit + i + 1}
                    </TableCell>
                    <TableCell className="px-4 font-medium capitalize text-slate-800">
                      {cls?.name}
                    </TableCell>
                    <TableCell className="px-4">
                      <StatusBadge status={cls?.isActive ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-primary"
                        onClick={() => handleEdit(cls)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
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
  );
};

export default SubjectTable;
