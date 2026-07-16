export type ProfileFormData = {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  confirmPassword: string;
  experience: string;
  education_qualification: string;
  weekly_availability: {
    _id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
    isActive: boolean;
  }[];
  rating: string;
  location: string;
  selected_class: {
    class_id: string;
    price: number;
    subject: {
      subject_id: string;
      subject_price: number;
    }[];
  }[];
  payment_details: {
    back_account: string;
    ifsc_code: string;
    branch: string;
    account_holder_name: string;
    upi_id: string;
  };
  id_proof: string;
  additional_details: string;
  gender: string;
  profile_pic: File | null;
  profilePicPreview: string;
  message: string;
};