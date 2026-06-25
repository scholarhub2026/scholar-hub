import React from "react";
import { Label } from "../ui/label";
import { useSnapshot } from "valtio";
import { store } from "@/contexts/store";

const MentorProfile = () => {
  const { modalData } = useSnapshot(store);

  return (
    <div className="p-6  bg-white shadow-lg rounded-2xl">
      <h4 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Mentor Details
      </h4>

      <div className="flex flex-col gap-4 text-sm text-gray-700">
        <div>
          <Label className="text-gray-500">First Name</Label>
          <p className="font-medium">{modalData?.firstName || "N/A"}</p>
        </div>

       

        <div>
          <Label className="text-gray-500">Email</Label>
          <p className="font-medium">{modalData?.email || "N/A"}</p>
        </div>

        <div>
          <Label className="text-gray-500">Phone</Label>
          <p className="font-medium">{modalData?.phoneNumber || "N/A"}</p>
        </div>

        <div>
          <Label className="text-gray-500">Message</Label>
          <p className="font-medium whitespace-pre-line">
            {modalData?.message || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
