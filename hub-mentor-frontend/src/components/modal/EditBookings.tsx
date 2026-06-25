
import { useForm } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useSnapshot } from "valtio";
import { store } from "@/contexts/store";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useUpdateBookingMutation } from "@/api/booking/update-booking";
import { handleCloseModal } from "@/contexts/modal-state";

const EditBookings = () => {
 const snap = useSnapshot(store);
  const booking = snap?.modalData?.booking; // safely access booking

  

  const {mutate}=useUpdateBookingMutation();

  

 const { register, handleSubmit, setValue, formState: { errors } } = useForm<{
  paymentStatus: string;
  bookingStatus: string;
  remarks: string;
  totalAmount:string;
}>({
  defaultValues: {
    paymentStatus: booking?.paymentStatus || "pending",
    bookingStatus: booking?.bookingStatus || "pending",
    remarks: booking?.remarks || "",
    totalAmount:booking?.totalAmount
  },
});


  if (!booking) {
    return (
      <div className="p-6 rounded-2xl bg-white">
        <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">
          No booking data available
        </h1>
      </div>
    );
  }

  const onSubmit = (data) => {
    
      mutate({
        bookingId:booking._id,
        updateData:{
          ...data
        }
      },
   { onSuccess: () => {
     handleCloseModal()
    }}
  )
    // TODO: Call your API or update store here
  };

  return (
    <div className="p-6 rounded-2xl bg-white">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">
        Edit Booking
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Payment Status */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Select
            onValueChange={(value) => setValue("paymentStatus", value)}
            defaultValue={booking.paymentStatus}
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2 text-left capitalize">
              <SelectValue placeholder="Select Payment Status" />
            </SelectTrigger>
            <SelectContent className="w-full border border-gray-300 rounded-md">
              <SelectItem value="completed">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          {errors.paymentStatus && (
            <p className="text-red-500 text-sm">
              {errors.paymentStatus.message}
            </p>
          )}
        </div>

        {/* Booking Status */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="bookingStatus">Booking Status</Label>
          <Select
            onValueChange={(value) => setValue("bookingStatus", value)}
            defaultValue={booking.bookingStatus}
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2 text-left capitalize">
              <SelectValue placeholder="Select Booking Status" />
            </SelectTrigger>
            <SelectContent className="w-full border border-gray-300 rounded-md">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {errors.bookingStatus && (
            <p className="text-red-500 text-sm">
              {errors.bookingStatus.message}
            </p>
          )}
        </div>
         <div className="flex flex-col gap-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input
            id="totalAmount"
            placeholder="Enter total amount"
            className="resize-none"
            {...register("totalAmount", { required: "Total Amount is required" })}
          />
          {errors.totalAmount && (
            <p className="text-red-500 text-sm">{errors.totalAmount.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            placeholder="Enter your remarks"
            className="resize-none"
            {...register("remarks", { required: "Remarks are required" })}
          />
          {errors.remarks && (
            <p className="text-red-500 text-sm">{errors.remarks.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Update Booking
        </Button>
      </form>
    </div>
  );
};

export default EditBookings;
