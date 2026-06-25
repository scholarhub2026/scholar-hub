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
    <div className="bg-white p-6 rounded-xl shadow-md overflow-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-100">
          <TableRow className="text-center">
            <TableHead className="px-4 py-3">#</TableHead>
            {columns.map((col) => (
              <TableHead key={col.key} className="px-4 py-3 text-center">
                {col.label}
              </TableHead>
            ))}
            {renderActions && (
              <TableHead className="px-4 py-3 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="text-center">
                  <TableCell>
                    <Skeleton className="h-4 w-4 mx-auto" />
                  </TableCell>
                  {columns.map((col, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-6 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            : data.length > 0
              ? data.map((item, i) => (
                  <TableRow key={item._id || i} className="text-center">
                    <TableCell>{i + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key} className="capitalize">
                        {col.render ? col.render(item) : item[col.key]}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell className="flex gap-2  justify-end">
                        {renderActions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-4">
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
        </TableBody>
      </Table>

      {pagination && (
        <PaginationControl
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
};

export default DataTable;
