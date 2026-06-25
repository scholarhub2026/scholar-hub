import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Pencil, Trash } from "lucide-react";
import { useGetSubjectQuery } from "@/api/subject/get-subject";
import { Pagination } from "../ui/pagination";
import PaginationControl from "../ui/PaginationController";

const SubjectTable = ({ setValue }) => {
  const [page, setPage] = useState(1);
  const limit = 5;
  const {
    data: subjects,
    isLoading,
    isSuccess,
  } = useGetSubjectQuery({
    subjectType: "subject",
    page,
    limit,
  });
 
  
  const total = subjects?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleEdit = (subject) => {
    setValue("isActive", subject.isActive);
    setValue("subject", subject.name);
    setValue("subjectId", subject._id);
    setValue("isEdit", true);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!isSuccess || !subjects) return <div>No subjects found</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md overflow-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-100">
          <TableRow className="text-center">
            <TableHead className="px-4 py-3 text-center">#</TableHead>
            <TableHead className="px-4 py-3 text-center">Subject</TableHead>

            <TableHead className="px-4 py-3 text-center">Status</TableHead>
            <TableHead className="px-4 py-3 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects?.data?.map((cls, i) => (
            <TableRow className="text-center" key={cls._id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="capitalize">{cls?.name}</TableCell>

              <TableCell>
                {cls?.isActive ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-red-600 font-medium">Inactive</span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <button
                  onClick={() => handleEdit(cls)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 inline" />
                </button>
                {/* <button
                  onClick={() => {
                    const confirmDelete = confirm(
                      "Are you sure you want to delete this class?"
                    );
                    if (confirmDelete) deleteClass(cls._id);
                  }}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash className="w-4 h-4 inline" />
                </button> */}
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
    </div>
  );
};

export default SubjectTable;
