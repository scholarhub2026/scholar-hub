import { useGetClassesQuery } from "@/api/class/get-classess";
import { useCreateSubjectMutation } from "@/api/subject/create-subject";
import { useUpdateSubjectMutation } from "@/api/subject/edit-subject";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SubjectTable from "@/components/Subject/SubjectTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useState } from "react";

import { useForm, Controller } from "react-hook-form";

const SubjectPage = () => {
  const [editData, setEditData] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
    reset,
  } = useForm();

  const {mutate: createSubject} = useCreateSubjectMutation();
  const {mutate: updateSubject} = useUpdateSubjectMutation();

  const onSubmit = (data) => {
    
   
    if (watch("isEdit")) {
      updateSubject({
        id:data.subjectId,
        payload:{
          name:data.subject,
          isActive:data.isActive
        }
      })
      
     
    } else {
      // Create new subject
      createSubject({
        name: data.subject,
        isActive: data.isActive,
      });
    }
    reset()
    
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-2">
          Subject & Syllabus Management
        </h1>
        <p className="text-gray-600 mb-6">Create or manage subject records</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-xl shadow-md space-y-6"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter the subject"
                className="cursor-pointer capitalize"
                {...register("subject", { required: "Class is required" })}
                error={errors?.subject?.message?.toString()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <Controller
                name="isActive"
                control={control}
                defaultValue={editData?.isActive || true}
                render={({ field: { onChange, value } }) => (
                  <Switch checked={value} onCheckedChange={onChange} />
                )}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Button className="mt-5 w-full" type="submit">
                {watch("isEdit") ? "Update Subject" : "Create Subject"}
              </Button>
              {watch("isEdit") && (
                <Button
                  variant="secondary"
                  className="mt-5 w-full bg-yellow-500 hover:bg-yellow-600 "
                  type="button"
                  onClick={() => {
                    setValue("isEdit", false);
                    reset();
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
          <SubjectTable setValue={setValue} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubjectPage;
