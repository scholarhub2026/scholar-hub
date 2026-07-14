import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import DataTable from "@/components/reusable/DataTable";
import Swal from "sweetalert2";

import { BadgeCheck, Eye, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import { useDeleteMentorMutation } from "@/api/mentor/delete-mentor";
import { handleOpenModal } from "@/contexts/modal-state";
import { Button } from "@/components/ui/button";

const MentorDetails = () => {
  const [page, setPage] = useState(1);
  const limit = 5;
  const columns = [
    {
      key: "email",
      label: "Email",
      render: (item) => <span className="lowercase">{item.email}</span>,
    },
    {
      key: "firstName",
      label: "Name",
      className: "capitalize",
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
  const { mutate: deleteMentor } = useDeleteMentorMutation();

  /** Confirm + delete. Used as "Reject" for applications, "Remove" for approved. */
  const handleRemoveMentor = (item, isPending: boolean) => {
    Swal.fire({
      title: isPending ? "Reject this application?" : "Remove this mentor?",
      text: isPending
        ? `${item?.firstName || "This applicant"}'s application and account will be permanently deleted.`
        : `${item?.firstName || "This mentor"} will be permanently removed and can no longer log in. Past bookings keep their records.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isPending ? "Yes, reject" : "Yes, remove",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMentor(item._id);
      }
    });
  };

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
          onSuccess: (response) => {
            const creds = response?.data?.credentials;
            const emailSent = response?.data?.emailSent;

            if (!creds) {
              Swal.fire({
                title: "Approved!",
                text: `${item?.firstName || "The mentor"} has been approved.`,
                icon: "success",
              });
              return;
            }

            const credsText = `Scholar Hub login\nEmail: ${creds.email}\nPassword: ${creds.password}\nLogin at: ${window.location.origin}/login`;

            Swal.fire({
              title: "Mentor approved!",
              icon: emailSent ? "success" : "warning",
              html: `
                <p style="margin-bottom:10px;font-size:14px;color:#475569">
                  ${
                    emailSent
                      ? "Credentials were emailed to the mentor. They're also shown here in case the email doesn't arrive:"
                      : "⚠️ The credentials email could <b>not</b> be sent. Share these with the mentor manually (WhatsApp / email):"
                  }
                </p>
                <div style="text-align:left;background:#f1f5f9;border-radius:10px;padding:14px;font-family:monospace;font-size:14px">
                  <div><b>Email:</b> ${creds.email}</div>
                  <div><b>Password:</b> ${creds.password}</div>
                </div>
                <p style="margin-top:10px;font-size:12px;color:#94a3b8">
                  This password is shown only once — copy it now.
                </p>`,
              showCancelButton: true,
              confirmButtonText: "Copy credentials",
              cancelButtonText: "Close",
              confirmButtonColor: "#2563EB",
            }).then((r) => {
              if (r.isConfirmed) {
                navigator.clipboard
                  .writeText(credsText)
                  .then(() =>
                    Swal.fire({
                      title: "Copied!",
                      text: "Credentials copied to clipboard.",
                      icon: "success",
                      timer: 1500,
                      showConfirmButton: false,
                    })
                  )
                  .catch(() => {});
              }
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
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleRemoveMentor(item, true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Reject
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
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleRemoveMentor(item, false)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
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
