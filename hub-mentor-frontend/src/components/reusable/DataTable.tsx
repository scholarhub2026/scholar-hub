import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationControl from "../ui/PaginationController";
import { Skeleton } from "../ui/skeleton";
import { Inbox } from "lucide-react";

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyText = "No data found",
  onEdit,
  renderActions,
  pagination,
  skeletonCount = 5,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                #
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {col.label}
                </TableHead>
              ))}
              {renderActions && (
                <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-slate-100">
                  <TableCell className="px-4">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  {columns.map((col, idx) => (
                    <TableCell key={idx} className="px-4">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell className="px-4 text-right">
                      <Skeleton className="ml-auto h-4 w-6" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item, i) => (
                <TableRow
                  key={item._id || i}
                  className="border-slate-100 transition-colors hover:bg-slate-50/60"
                >
                  <TableCell className="px-4 text-slate-400">{i + 1}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-4 capitalize text-slate-700">
                      {col.render ? col.render(item) : item[col.key]}
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell className="px-4">
                      <div className="flex justify-end gap-1.5">{renderActions(item)}</div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox className="h-8 w-8" />
                    <span className="text-sm">{emptyText}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="border-t border-slate-100 px-4">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
