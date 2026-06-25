import React, { useEffect } from "react";
import { useSnapshot } from "valtio";
import { useForm, Controller } from "react-hook-form";

import { store } from "@/contexts/store";
import { useGetInqueryQuery } from "@/api/form-query/get-inquery";
import { useUpdateInqueryMutation } from "@/api/form-query/create-inquery";

import { TInQueryFormValues } from "@/types/inquery-form";

import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const STATUS_OPTIONS = ["PENDING", "IN PROGRESS", "COMPLETED", "CANCELLED"];

const StatusUpdate = () => {
  const snap = useSnapshot(store);
  const id = snap.modalData 

  const { data, isSuccess } = useGetInqueryQuery(id);
  const { mutate } = useUpdateInqueryMutation(id);

  const userDetails = data?.data;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TInQueryFormValues>({
    defaultValues: {
      status: "",
    },
  });

  useEffect(() => {
    if (isSuccess && userDetails?.status) {
      setValue("status", userDetails.status);
    }
  }, [isSuccess, userDetails, setValue]);

  const onSubmit = (values: TInQueryFormValues) => {
    mutate(values);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold">Update Query</h1>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2 mt-5">
          <Label>Status</Label>

          <Controller
            name="status"
            control={control}
            rules={{ required: "Status is required" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit
        </Button>
      </form>
    </div>
  );
};

export default StatusUpdate;
