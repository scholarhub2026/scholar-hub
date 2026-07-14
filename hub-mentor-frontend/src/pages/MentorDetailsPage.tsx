import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DataTable from "@/components/reusable/DataTable";
import Swal from "sweetalert2";

import { BadgeCheck, Eye } from "lucide-react";
import React, { useState } from "react";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import { handleOpenModal } from "@/contexts/modal-state";
import { Button } from "@/components/ui/button";

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
      render: (item) => <StatusBadge status={item.isActive ? "active" : "inactive"} />,
    },
  ];

  const {mutate}=useUpdateMentorMutation()

 const handlePromoteAdmin = (item) => {
  const data = {
    admin_approve: true,
  };

  Swal.fire({
    title: "Approve this mentor?",
    text: `${item?.firstName || "This applicant"} will be approved and their login credentials will be emailed to ${item?.email || "them"}.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563EB",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, approve",
  }).then((result) => {
    if (result.isConfirmed) {
      mutate(
        { id: item._id, data },
        {
          onSuccess: () => {
            Swal.fire({
              title: "Approved!",
              text: `${item?.firstName || "The mentor"} is approved — login credentials have been emailed to them.`,
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
      <PageHeader
        title="Mentors"
        description="Review mentor applications and manage approved mentors."
      />

      <h2 className="mb-3 font-display text-lg font-bold text-slate-900">
        Pending approval
      </h2>
      <DataTable
        columns={columns}
        data={MentorData?.data || []}
        loading={isLoading}
        emptyText="No Mentor details found"
        onEdit={(item) => console.log("Edit", item)}
        // onDelete={(item) => console.log("Delete", item)}
        renderActions={(item) => (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-primary"
              onClick={() => handleOpenModal("mentorProfile", item)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View
            </Button>
            <Button size="sm" onClick={() => handlePromoteAdmin(item)}>
              <BadgeCheck className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
        pagination={{
          currentPage: page,
          totalPages: Math.ceil((MentorData?.data?.total || 0) / limit),
          onPageChange: setPage,
        }}
      />
      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-slate-900">
        Approved mentors
      </h2>
      <DataTable
        columns={columns}
        data={approvedMentorData?.data || []}
        loading={approvedMentorLoading}
        emptyText="No Mentor details found"
        onEdit={(item) => console.log("Edit", item)}
        // onDelete={(item) => console.log("Delete", item)}
        renderActions={(item) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-primary"
            onClick={() => handleOpenModal("mentorProfile", item)}
          >
            <Eye className="mr-1.5 h-4 w-4" />
            View
          </Button>
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
