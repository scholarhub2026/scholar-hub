import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSnapshot } from "valtio";
import { store } from "@/contexts/store";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "../ui/table";
import { Pencil, Trash } from "lucide-react";
import { useBookingLogsQuery } from "@/api/Booking Log/get-booking-log";
import { useCreateBookingLogMutation } from "@/api/Booking Log/create-booking-log";
import { useUpdateBookingLogMutation } from "@/api/Booking Log/update-booking-log";


type FormValues = {
  date: string;
  startTime: string;
  endTime: string;
};

const StudentLogModal = () => {
  const { modalData } = useSnapshot(store);

  console.log(modalData.id);
  

  // Fetch booking logs
  const { data: logs, isLoading, isError, error } = useBookingLogsQuery(
    modalData?.id
  );

  // Mutations
  const { mutate: createBookingLog } = useCreateBookingLogMutation();
  const { mutate: updateBookingLog } = useUpdateBookingLogMutation(
    modalData?.id
  );

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      date: modalData?.date
        ? new Date(modalData.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      startTime: modalData?.startTime || "",
      endTime: modalData?.endTime || "",
    },
  });

  const onSubmit = (formData: FormValues) => {
    createBookingLog({
      bookingId: modalData.id,
      logData: {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
    });
  };

  // Render logs table
  const renderLogsTable = useMemo(() => {
    if (isLoading) return <div>Loading logs...</div>;
    if (isError)
      return <p className="text-red-500">Error: {error?.message || "Unknown"}</p>;
    if (!logs || logs.length === 0) return <p>No logs found.</p>;

    return (
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-100">
          <TableRow className="text-center">
            <TableHead>#</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            {/* <TableHead className="text-right">Actions</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index: number) => (
            <TableRow key={log.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
              <TableCell>{log.startTime}</TableCell>
              <TableCell>{log.endTime}</TableCell>
              {/* <TableCell className="flex gap-2 justify-end">
                <Pencil className="w-4 h-4 cursor-pointer" />
                <Trash className="w-4 h-4 cursor-pointer" />
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }, [logs, isLoading, isError, error]);

  return (
    <div className="p-6 rounded-2xl bg-white  ">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">
        {modalData?.type === "view" ? "View Logs" : "Register Log"}
      </h1>

      {modalData?.type === "log" ? (
        renderLogsTable
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register("date", { required: "Date is required" })}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          {/* Start Time */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              {...register("startTime", { required: "Start time is required" })}
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm">{errors.startTime.message}</p>
            )}
          </div>

          {/* End Time */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              {...register("endTime", { required: "End time is required" })}
            />
            {errors.endTime && (
              <p className="text-red-500 text-sm">{errors.endTime.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Update Booking
          </Button>
        </form>
      )}
    </div>
  );
};

export default StudentLogModal;
