export interface TutorData {
  payment_details: {
    back_account: string;
    ifsc_code: string;
    branch: string;
    account_holder_name: string;
    upi_id: string;
  };
  _id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: "TUTOR" | string; // If it's always TUTOR, keep it literal, otherwise string
  isActive: boolean;
  message: string;
  completed_profile: boolean;
  available_slot: {
    time: string; // ISO date string
    _id: string;
  }[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
  is_first_login: boolean;
  additional_details: string;
  education_qualification: string;
  experience: string;
  gender: string;
  id_proof: string;
  location: string;
  profile_pic: string;
  selected_class: {
    class_id: {
      _id: string;
      class: string;
      syllabus: string;
    };
    price: number;
    subject: {
      subject_id: {
        _id: string;
        name: string;
      };
      subject_price: number;
    }[];
  }[];
}
