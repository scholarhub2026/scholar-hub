import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import Booking from "@/components/BookingPage/booking";
import Details from "@/components/BookingPage/details";
import { useCreateBookingMutation } from "@/api/booking/create-booking";
import { useUpdateBookingMutation } from "@/api/booking/update-booking";
import { makePayment } from "@/lib/payment-gateway";
import { useAuth } from "@/auth/AuthProvider";
import { roleHome, roleSlug } from "@/config/roles";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";



// Define the steps in the booking process
const steps = [
  { id: "booking", name: "Booking" },
  { id: "details", name: "Details" },
  { id: "payment", name: "Payment" },
  { id: "confirmation", name: "Confirmation" },
];

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const { data, isSuccess } = useGetMentorQuery({
    id: id as string,
  });
  const { mutate } = useCreateBookingMutation();
  const { mutate: updateBooking } = useUpdateBookingMutation();


  useEffect(() => {
    if (isSuccess) {
      setMentor(data.data);
    }
  }, [data, isSuccess]);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    mentorId: id,
    studentId: "68d94dd96a78d2bafebb4ee6",
    studentName: "",
    email: "",
    phone: "",
    sessionType: "one-time",
    message: "",
    agreeToTerms: false,
    selectedSyllabus: "",
    selectedClass: "",
    bookingType: "", // "full", "individual", "multiple"
    selectedSubjects: [],

    totalAmount: 0,
    paymentType: "", // "credit-card", "paypal", etc.
    paymentStatus: "pending", // "pending", "completed", "failed"
    transactionId: "", // from payment gateway
    bookingDate: null,
    orderId: 0,
  });

  if (!mentor) {
    return (
      <MainLayout>
        <div className="container-wide py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Mentor not found</h2>
          <p className="text-muted-foreground mb-6">
            The mentor you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/mentors">
            <Button>Back to Mentors</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      agreeToTerms: e.target.checked,
    }));
  };

  const nextStep = () => {
  if (currentStep < steps.length - 1) {
    // If not the last step
    setFormData((prev) => ({
      ...prev,
      isValidated: false, // Reset validation on step change
    }));

    // Special handling for step 2 (the "Review & pay" step):
    // create the booking, then open the payment gateway (unless it's free).
    if (currentStep === 2) {
      const updatedForm = {
        ...formData,
        orderId: Math.floor(Math.random() * 100000),
      };

      setFormData(updatedForm);

      mutate(updatedForm, {
        onSuccess: (res: any) => {
          const bookingId = res?.newBooking?._id;

          // Free (₹0) booking — nothing to pay, go straight to confirmation.
          if (!updatedForm.totalAmount || updatedForm.totalAmount < 1) {
            setCurrentStep((prev) => prev + 1);
            return;
          }

          // Paid booking — open Razorpay. On success mark it paid, then confirm.
          makePayment({
            totalAmount: updatedForm.totalAmount,
            orderId: updatedForm.orderId,
            bookingId,
            studentName: updatedForm.studentName,
            email: updatedForm.email,
            phone: updatedForm.phone,
            onSuccess: (rp) => {
              if (bookingId) {
                updateBooking({
                  bookingId,
                  updateData: {
                    paymentStatus: "completed",
                    transactionId: rp.razorpay_payment_id,
                  },
                });
              }
              setCurrentStep(3);
            },
            // Closed without paying — booking stays pending; they can pay later
            // from "My Bookings". Still show the confirmation.
            onDismiss: () => setCurrentStep(3),
          });
        },
        onError: (error) => {
          console.error("API Error:", error);
          alert("Something went wrong. Please try again.");
        },
      });
    } else {
      // Just go to the next step if not step 2
      setCurrentStep((prev) => prev + 1);
    }
  }
};

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.selectedSyllabus &&
          formData.selectedClass &&
          formData.bookingType &&
          (formData.bookingType === "full" ||
            formData.selectedSubjects.length > 0)
        );
      case 1:
        return formData.studentName && formData.email && formData.phone;
      case 2:
        return true;
      default:
        return true;
    }
  };

  return (
    <MainLayout>
      <div className="container-wide py-8 md:py-12">
        {/* Progress Steps */}
        <div className="mx-auto mb-10 max-w-2xl">
          <div className="flex items-start">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    className={cn(
                      "mt-5 h-0.5 flex-1 rounded-full transition-colors",
                      index <= currentStep ? "bg-primary" : "bg-slate-200",
                    )}
                  />
                )}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      index < currentStep
                        ? "bg-primary text-white"
                        : index === currentStep
                          ? "bg-primary text-white ring-4 ring-primary/15"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      index <= currentStep ? "text-slate-900" : "text-slate-400",
                    )}
                  >
                    {step.name}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Schedule Step */}
          {currentStep === 0 && (
            <Booking
              formData={formData}
              setFormData={setFormData}
              mentor={mentor}
            />
          )}

          {/* Details Step */}
          {currentStep === 1 && (
            <Details
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
            />
          )}

          {/* Payment Step */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <div className="mb-8 text-center">
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Review &amp; pay
                </h2>
                <p className="mt-1 text-slate-500">Confirm your booking details below.</p>
              </div>

              <div className="mx-auto max-w-xl space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mentor</span>
                      <span className="font-medium capitalize text-slate-800">
                        {mentor.firstName} {mentor.lastName}
                      </span>
                    </div>
                    {formData.selectedClass?.class_id?.class && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Class</span>
                        <span className="font-medium capitalize text-slate-800">
                          {formData.selectedClass.class_id.class} · {formData.selectedSyllabus}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Booking type</span>
                      <span className="font-medium capitalize text-slate-800">
                        {formData.bookingType}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-gradient px-5 py-4 text-white">
                    <span className="font-medium">Total</span>
                    <span className="font-display text-xl font-bold">
                      {formData.totalAmount > 0 ? `₹${formData.totalAmount}` : "Free"}
                    </span>
                  </div>
                  {!formData.totalAmount || formData.totalAmount < 1 ? (
                    <p className="mt-3 text-center text-sm text-slate-500">
                      No payment needed — your session will be booked instantly.
                    </p>
                  ) : null}
                </div>

                {/* <div className="space-y-4 pt-4">
                  <h3 className="font-semibold">Payment Method</h3>
                   <div className="space-y-2">
                            <Label>Session Type</Label>
                            <RadioGroup
                              
                              onValueChange={(value) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  sessionType: value,
                                }));
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cash on complete" id="cash-on-complete" />
                                <Label htmlFor="cash-on-complete">Cash on Complete</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="razorpay" id="razorpay" />
                                <Label htmlFor="razorpay">Razorpay</Label>
                              </div>
                            </RadioGroup>
                          </div>
                  
                  
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.agreeToTerms}
                      onChange={handleTermsChange}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the <a href="#" className="text-primary underline">terms and conditions</a>
                    </Label>
                  </div>
                </div> */}
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 3 && (
            <div className="animate-fade-in text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12 text-green-600"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Your session has been successfully scheduled.
              </p>

              <div className="max-w-md mx-auto mb-8 text-left bg-muted/50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <span className="font-medium block">Mentor:</span>
                    <span>
                      {mentor.firstName} {mentor.lastName}
                    </span>
                  </div>
                  <div>
                    {/* <span className="font-medium block">Date & Time:</span> */}
                    {/* <span>{date?.toLocaleDateString()} at {time}</span> */}
                  </div>
                  <div>
                    <span className="font-medium block">Student:</span>
                    <span>{formData.studentName}</span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-8">
                A confirmation email has been sent to {formData.email}. <br />
                You can view and manage all your upcoming sessions in your
                dashboard.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {user ? (
                  <>
                    <Link to={roleHome(user.role)}>
                      <Button>Go to Dashboard</Button>
                    </Link>
                    {roleSlug(user.role) === "student" && (
                      <Link to="/app/bookings">
                        <Button variant="outline">View my bookings</Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <Link to="/">
                    <Button variant="outline">Back to Home</Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <div className="mx-auto mt-8 flex max-w-xl justify-between">
              {currentStep > 0 ? (
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              <Button onClick={nextStep} disabled={!isStepComplete()}>
                {currentStep === 2
                  ? formData.totalAmount > 0
                    ? "Proceed to Pay"
                    : "Confirm Booking"
                  : "Continue"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BookingPage;
