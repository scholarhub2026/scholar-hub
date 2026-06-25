export type TSignupFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
  terms: boolean;
  phoneNumber: string;
};

export type TLoginFormValues = {
  email: string;
  password: string;
};

export interface APIErrorResponse {
  response: {
    data: {
      message: string;
    };
  };
}
