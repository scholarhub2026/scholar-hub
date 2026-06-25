import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useForm, SubmitHandler } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useGetSubjectQuery } from "@/api/subject/get-subject";
import { useCreateClassMutation } from "@/api/class/create-classess";
import { useGetClassesQuery } from "@/api/class/get-classess";
import ClassManagement from "@/components/class/Class-Table";
import { Pencil, Trash } from "lucide-react";
import { useUpdateClassMutation } from "@/api/class/update-class";
import { id } from "date-fns/locale";

// ---------------- Types ----------------
type Subject = {
  _id: string;
  name: string;
};

type SubjectWithPrice = {
  name: string;
  subjectId: string;
  price: number;
};

interface ClassFormValues {
  class: string;
  syllabus: string;
  basePrice: number;
  sortOrder?: number;
  subjects?: SubjectWithPrice[];
}

// ---------------- Component ----------------
const ClassPage = () => {
  const { data, isLoading } = useGetSubjectQuery({
    subjectType: "subject",
    limit: 1000,
    page: 1,
  });

  const { data: classData } = useGetClassesQuery({ page: 1, limit: 10000 });
  const { mutate } = useCreateClassMutation();
  const {mutate:updateClassMutate}=useUpdateClassMutation()

  const subjects: Subject[] = data?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<ClassFormValues>();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectPrice, setSubjectPrice] = useState("");
  const [addedSubjects, setAddedSubjects] = useState<SubjectWithPrice[]>([]);
  const [editSubjectIndex, setEditSubjectIndex] = useState<number | null>(null);

  const [isActive, setIsActive] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  // ---------------- Handlers ----------------
const onSubmit: SubmitHandler<ClassFormValues> = (formData) => {
  if (addedSubjects.length === 0) {
    return setError("subjects", {
      type: "manual",
      message: "At least one subject must be added.",
    });
  }

  const payload = {
    ...formData,
    basePrice: Number(formData.basePrice),
    sortOrder: formData.sortOrder || 0,
    subjects: addedSubjects.map(({ subjectId, price }) => ({ subjectId, price })),
    isActive,
  };

  if (editId) {
    // Pass both id and payload
    return updateClassMutate(
      { id: editId, classData: payload },
      {
        onSuccess: () => {
          reset();
          setAddedSubjects([]);
          setSelectedSubject(null);
          setEditId(null);
          setIsActive(true);
        },
      }
    );
  }

  // Create new class
  mutate(payload, {
    onSuccess: () => {
      reset();
      setAddedSubjects([]);
      setSelectedSubject(null);
      setEditId(null);
      setIsActive(true);
    },
  });
};


  const handleAddSubject = () => {
    if (!selectedSubject || !subjectPrice) {
      return setError("subjects", {
        type: "manual",
        message: "Subject and price are required.",
      });
    }

    clearErrors("subjects");

    const newSubject: SubjectWithPrice = {
      name: selectedSubject.name,
      subjectId: selectedSubject._id,
      price: Number(subjectPrice),
    };

    if (editSubjectIndex !== null) {
      const updatedSubjects = [...addedSubjects];
      updatedSubjects[editSubjectIndex] = newSubject;
      setAddedSubjects(updatedSubjects);
      setEditSubjectIndex(null);
    } else {
      setAddedSubjects((prev) => [...prev, newSubject]);
    }

    setSelectedSubject(null);
    setSubjectPrice("");
  };

  const handleRemoveSubject = (subjectId: string) => {
    setAddedSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));
  };

  // ---------------- Edit Mode ----------------
  useEffect(() => {
    if (!editId) return;

    const classToEdit = classData?.data?.find((cls) => cls._id === editId);

    if (classToEdit) {
      setValue("class", classToEdit.class);
      setValue("syllabus", classToEdit.syllabus);
      setValue("basePrice", classToEdit.basePrice);
      setValue("sortOrder", classToEdit.sortOrder || 0);
      setIsActive(classToEdit.isActive);

      setAddedSubjects(
        classToEdit.subjects.map((subj: any) => ({
          name: subj.subjectId.name,
          subjectId: subj.subjectId._id,
          price: subj.price,
        }))
      );
    } else {
      reset();
      setIsActive(true);
      setAddedSubjects([]);
    }
  }, [editId, classData, setValue, reset]);

  // ---------------- Render ----------------
  return (
    <DashboardLayout userRole="admin">
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-2">Class Management</h1>
        <p className="text-gray-600 mb-6">Create or manage class records</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ---------------- Form ---------------- */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-xl shadow-md space-y-6"
          >
            {/* Class Name */}
            <div>
              <Label>Class Name</Label>
              <Input placeholder="E.g. 10th Grade" {...register("class", { required: true })} />
              {errors.class && <p className="text-sm text-red-500">Class is required</p>}
            </div>

            {/* Syllabus */}
            <div>
              <Label>Syllabus</Label>
              <Input placeholder="E.g. CBSE / State" {...register("syllabus", { required: true })} />
              {errors.syllabus && <p className="text-sm text-red-500">Syllabus is required</p>}
            </div>

            {/* Base Price */}
            <div>
              <Label>Base Price</Label>
              <Input type="number" placeholder="E.g. 5000" {...register("basePrice", { required: true })} />
              {errors.basePrice && <p className="text-sm text-red-500">Base price is required</p>}
            </div>

            {/* Subjects */}
            <div>
              <Label>Add Subject with Price</Label>
              <div className="flex gap-2 items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-1/2 text-left capitalize">
                      {selectedSubject?.name || "Select Subject"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-1/2 max-h-60 overflow-y-auto capitalize">
                    {subjects
                      .filter(
                        (subj) => !addedSubjects.some((s) => s.subjectId === subj._id)
                      )
                      .map((subj) => (
                        <DropdownMenuItem key={subj._id} onClick={() => setSelectedSubject(subj)}>
                          {subj.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  type="number"
                  placeholder="Price"
                  value={subjectPrice}
                  onChange={(e) => setSubjectPrice(e.target.value)}
                />

                <Button type="button" onClick={handleAddSubject}>
                  {editSubjectIndex !== null ? "Update" : "Add"}
                </Button>
              </div>
              {errors.subjects && <p className="text-sm text-red-500 mt-1">{errors.subjects.message}</p>}
            </div>

            {/* Subject List */}
            {addedSubjects.length > 0 && (
              <div className="space-y-2">
                {addedSubjects.map((subj, index) => (
                  <div
                    key={`${subj.subjectId}-${index}`}
                    className="flex justify-between capitalize items-center p-2 border rounded"
                  >
                    <span>{subj.name} - ₹{subj.price}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const subjectData = subjects.find((s) => s._id === subj.subjectId);
                          setSelectedSubject(subjectData || { name: subj.name, _id: subj.subjectId });
                          setSubjectPrice(subj.price.toString());
                          setEditSubjectIndex(index);
                        }}
                      >
                        <Pencil className="w-4 h-4 inline" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveSubject(subj.subjectId)}
                      >
                        <Trash className="w-4 h-4 inline" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <Label>Sort</Label>
              <Input type="number" placeholder="Sort Order" {...register("sortOrder",{required:true})} />
            </div>
            {errors.sortOrder && <p className="text-sm text-red-500">Sort order is required</p>}

            {/* Active Switch */}
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Submit / Update */}
            {editId ? (
              <div className="flex">
                <Button type="submit" className="w-full">Update Class</Button>
                <Button
                  type="button"
                  onClick={() => {
                    reset();
                    setAddedSubjects([]);
                    setSelectedSubject(null);
                    setEditId(null);
                    setIsActive(true);
                    clearErrors();
                  }}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 ml-2"
                >
                  Clear
                </Button>
              </div>
            ) : (
              <Button type="submit" className="w-full">Save Class</Button>
            )}
          </form>

          {/* ---------------- Table ---------------- */}
          <ClassManagement setEditId={setEditId} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassPage;
