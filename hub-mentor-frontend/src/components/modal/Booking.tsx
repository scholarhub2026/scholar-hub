import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { TInQueryFormValues } from "@/types/inquery-form";
import { useCreateInqueryMutation } from "@/api/form-query/create-inquery";
import { handleOpenModal } from "@/contexts/modal-state";
import { useGetClassesQuery } from "@/api/class/get-classess";
import { useCreateMentorMutation } from "@/api/mentor/create-mentor";
import { toast } from "sonner";
import { APIErrorResponse } from "@/types/loginPage";

const Booking = ({ formType }: { formType: string }) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<TInQueryFormValues>();

  const {
    data,
    error: classError,
    isError: isClassError,
    isSuccess,
  } = useGetClassesQuery({
    page: 1,
    limit: 100000,
  });

  const classes = data?.data;

  const selectedSubject = watch("subject");
  const { mutate } = useCreateInqueryMutation();
  const { mutate: createMentorMutate,isError ,error} = useCreateMentorMutation();
  const isMentor = () => {
    if (formType === "mentor") {
      return true;
    }
    return false;
  };

 const onSubmit = (data: TInQueryFormValues) => {
  if (isMentor()) {
    createMentorMutate(
      {
        ...data,
        phone: data?.phoneNumber,
        firstName: data?.name,
      },
      {
        onSuccess: () => {
          handleOpenModal("thankyou");
          reset();
        },
        onError: (error:APIErrorResponse) => {
          toast.error(error.response.data.message||"Something went wrong. Please try again.");
        },
      }
    );
  } else {
    mutate(data, {
      onSuccess: () => {
        handleOpenModal("thankyou");
        reset();
      },
      onError: (error:APIErrorResponse) => {
        toast.error(error.response.data.message||"Something went wrong. Please try again.");
      },
    });
  }
};

  return (
    <div className="p-6 rounded-2xl bg-white">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">
        {isMentor() ? "Become a Mentor" : "Enquiry Form"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter your name"
            {...register("name", { required: "Name is required" })}
            error={errors.name?.message}
          />
        </div>

        {/* <button onClick={()=>handleOpenModal('thankyou')}>open</button> */}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email", { required: "Email is required" })}
            error={errors.email?.message}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="Enter your phone"
            {...register("phoneNumber", {
              required: "Phone number is required",
            })}
            error={errors.phoneNumber?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="place">Place</Label>
          <Input
            id="place"
            placeholder="Enter your place"
            {...register("place", { required: "Place is required" })}
            error={errors.place?.message}
          />
        </div>

        {/* Subject Dropdown */}

        {!isMentor() && (
          <div className="flex flex-col gap-2">
            {/* <Label htmlFor="subject">Class</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start text-left">
                  {selectedSubject || "Select your class"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {isSuccess &&
                  classes?.map((cls) => (
                    <DropdownMenuItem
                      key={cls._id}
                      onClick={() => setValue("subject", cls.class)}
                    >
                      {cls.class}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu> */}
            {errors.subject && (
              <p className="text-red-500 text-sm">{errors.subject.message}</p>
            )}
            <div className="w-full  mx-auto">
  <label
    htmlFor="classSelect"
    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    Select Class
  </label>

  <div className="relative">
    <select
      id="classSelect"
      onChange={(e) => setValue('subject', e.target.value)}
      className="flex h-10 w-full rounded-md border bg-background appearance-none px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    >
      <option value="">{selectedSubject || "Select your class"}</option>
      {isSuccess &&
        classes?.map((cls, index) => (
          <option key={cls._id} value={cls.class}>
            {cls.class}
          </option>
        ))}
      
    </select>

    {/* Down arrow icon */}
    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
      <svg
        className="h-5 w-5 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  </div>
</div>

          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="message">
            {isMentor() ? "Describing Yourself" : "Message"}
          </Label>
          <Textarea
            id="message"
            placeholder={
              isMentor() ? "Describing Yourself" : "Enter your message"
            }
            className="resize-none"
            {...register("message", { required: "Message is required" })}
            error={errors.message?.message}
          />
        </div>

        {/* Submit */}
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

export default Booking;
