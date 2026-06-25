"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash } from "lucide-react";
import { useGetClassesQuery } from "@/api/class/get-classess";
import { useDeleteClassMutation } from "@/api/class/delete-class";
import PaginationControl from "../ui/PaginationController";

const ClassManagement = ({ setEditId }) => {
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading, isError, error } = useGetClassesQuery({ page, limit });
  const { mutate: deleteClass } = useDeleteClassMutation();

  const classes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Class List</h2>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : isError ? (
        <p className="text-red-600">Error: {error?.message}</p>
      ) : classes.length === 0 ? (
        <p className="text-gray-500">No class data available.</p>
      ) : (
        <>
          <Table className="min-w-full divide-y divide-gray-200">
            <TableHeader className="bg-gray-100">
              <TableRow className="text-center">
                <TableHead>#</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Syllabus</TableHead>
                <TableHead>Total Subjects</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls, i) => (
                <TableRow className="text-center" key={cls._id}>
                  <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                  <TableCell>{cls?.class}</TableCell>
                  <TableCell>{cls?.syllabus}</TableCell>
                  <TableCell>{cls?.subjects?.length}</TableCell>
                  <TableCell>₹{cls?.basePrice}</TableCell>
                  <TableCell>
                    {cls?.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <button
                      onClick={() => setEditId(cls._id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => {
                        const confirmDelete = confirm("Are you sure you want to delete this class?");
                        if (confirmDelete) deleteClass(cls._id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash className="w-4 h-4 inline" />
                    </button>
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
  );
};

export default ClassManagement;
