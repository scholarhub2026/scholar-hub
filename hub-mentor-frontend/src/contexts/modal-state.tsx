import { useSnapshot } from "valtio";
import { store } from "./store";
import { useMemo } from "react";
import { iMODAL_STATE } from "@/types";
import Booking from "@/components/modal/Booking";
import Thankyou from "@/components/modal/thankyou";
import StatusUpdate from "@/components/modal/status-update";
import MentorProfile from "@/components/modal/mentor-profile";
import EditBookings from "@/components/modal/EditBookings";
import StudentLogModal from "@/components/modal/StudentLogModal";

export const RenderModal = () => {
  const { modalState, isModalOpen } = useSnapshot(store);

  const renderedModal = useMemo(() => {
    if (!isModalOpen) return null; // Ensure modal is open

    switch (modalState) {
      case "form":
        return <Booking formType="student" />;
      case "MentorForm":
        return <Booking formType="mentor" />;
      case "thankyou":
        return <Thankyou />;
        case "mentorProfile":
        return <MentorProfile/>;
      case "status":
        return <StatusUpdate />;
        case "edit-booking":
        return <EditBookings />;
        case "student-log":
        return <StudentLogModal/>
    }
  }, [modalState, isModalOpen]);

  return renderedModal;
};

export const handleOpenModal = (
  state: iMODAL_STATE,
  data?: Record<string, unknown> | null
) => {
  store.isModalOpen = true;
  store.modalState = state;
  if (data !== undefined) {
    store.modalData = data;
  }
};

export const handleCloseModal = () => {
  store.isModalOpen = false;
  //   store.modalState = "";
  store.modalData = {};
};
