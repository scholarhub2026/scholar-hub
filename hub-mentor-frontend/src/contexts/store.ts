import { iMODAL_STATE } from "@/types";
import { proxy } from "valtio";

// NOTE: Session/user state has moved to <AuthProvider> (src/auth) as the single
// source of truth. This store is now ONLY ephemeral UI state (modals + the
// in-progress booking draft). Do not add auth/user fields back here.
export const store = proxy({
  isModalOpen: false,
  modalState: "" as iMODAL_STATE,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalData: {} as any,
  bookingDetails: {
    mentorId: "",
    fromDate: "",
    toDate: "",
    time: "",
  },
});
