import { iMODAL_STATE } from "@/types";
import { proxy } from "valtio";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "TUTOR" | "STUDENT";
  completedProfile: boolean;
  is_first_login?: boolean;
};

export const store = proxy({
  isModalOpen: false,
  modalState: "" as iMODAL_STATE,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modalData: {} as any,
  loggedUser: {} as User,
  getLoggedUser: () => {
    return store.loggedUser;
  },
  getUserRole: (): "student" | "mentor" | "admin" => {
  if (!store.loggedUser?.role) return "student";

  return store.loggedUser.role === "TUTOR"
    ? "mentor"
    : store.loggedUser.role === "ADMIN"
    ? "admin"
    : "student";
},
bookingDetails:{
  mentorId: "",
  fromDate: "",
  toDate: "",
  time: ""
}
});
