import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DataTable from "@/components/reusable/DataTable";
import Swal from "sweetalert2";

import { Eye, GemIcon, Pencil, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import { handleOpenModal } from "@/contexts/modal-state";

const MentorDetails = () => {
  const [page, setPage] = useState(1);
  const limit = 5;
  const columns = [
    {
      key: "email",
      label: "Email",
    },
    {
      key: "firstName",
      label: "Name",
    },
    {
      key: "phoneNumber",
      label: "Phone Number",
    },
    {
      key: "isActive",
      label: "Status",
      render: (item) => (
        <span className={item.isActive ? "text-green-600" : "text-red-600"}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const {mutate}=useUpdateMentorMutation()

 const handlePromoteAdmin = (item) => {
  const data = {
    admin_approve: true,
  };

  Swal.fire({
    title: "Are you sure?",
    text: `Do you want to promote ${item?.firstName || "this user"} as mentor?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, promote!",
  }).then((result) => {
    if (result.isConfirmed) {
      mutate(
        { id: item._id, data },
        {
          onSuccess: () => {
            Swal.fire({
              title: "Promoted!",
              text: `${item?.firstName || "The user"} has been promoted to mentor.`,
              icon: "success",
            });
          },
          onError: (error) => {
            Swal.fire({
              title: "Error!",
              text: error?.response?.data?.message || "Failed to promote mentor.",
              icon: "error",
            });
          },
        }
      );
    }
  });
};


  const { data: MentorData, isLoading } = useGetMentorQuery({
    page,
    limit,
   
  });

  const {data:approvedMentorData,isLoading:approvedMentorLoading}=useGetMentorQuery({
    page,
    limit,
    type:'approve'
  })


  
  
  return (
    <DashboardLayout userRole="admin">
     
        <h2 className="text-2xl font-semibold text-gray-800">Unapproved Mentors</h2>
     
      <DataTable
        columns={columns}
        data={MentorData?.data || []}
        loading={isLoading}
        emptyText="No Mentor details found"
        onEdit={(item) => console.log("Edit", item)}
        // onDelete={(item) => console.log("Delete", item)}
        renderActions={(item) => (
          <div className="flex gap-2 ">
            {/* <button onClick={() => console.log("Edit", item)}>
              <Pencil className="w-4 h-4 text-blue-500" />
            </button> */}
            <button onClick={() => handleOpenModal("mentorProfile", item)}>
              <Eye className="w-4 h-4 text-blue-500" />
            </button>
            <button onClick={() => handlePromoteAdmin(item)}>
              <GemIcon className="w-4 h-4 text-green-500" />
            </button>
          </div>
        )}
        pagination={{
          currentPage: page,
          totalPages: Math.ceil((MentorData?.data?.total || 0) / limit),
          onPageChange: setPage,
        }}
      />
      <div>
        
      </div>
      <h2 className="text-2xl font-semibold text-gray-800">Approved Mentors</h2>
      <DataTable
        columns={columns}
        data={approvedMentorData?.data || []}
        loading={approvedMentorLoading}
        emptyText="No Mentor details found"
        onEdit={(item) => console.log("Edit", item)}
        // onDelete={(item) => console.log("Delete", item)}
        renderActions={(item) => (
          <div className="flex gap-2 ">
            {/* <button onClick={() => console.log("Edit", item)}>
              <Pencil className="w-4 h-4 text-blue-500" />
            </button> */}
            <button onClick={() => handleOpenModal("mentorProfile", item)}>
              <Eye className="w-4 h-4 text-blue-500" />
            </button>
            {/* <button onClick={() => handlePromoteAdmin(item)}>
              <GemIcon className="w-4 h-4 text-green-500" />
            </button> */}
          </div>
        )}
        pagination={{
          currentPage: page,
          totalPages: Math.ceil((MentorData?.data?.total || 0) / limit),
          onPageChange: setPage,
        }}
      />
    </DashboardLayout>
  );
};

export default MentorDetails;
