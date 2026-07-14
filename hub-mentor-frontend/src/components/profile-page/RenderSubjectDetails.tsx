import { useGetClassesQuery } from "@/api/class/get-classess";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { ProfileFormData } from "@/types/profilePage";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { Input } from "../ui/input";

export default function RenderSubjectDetails({ mentorId }: { mentorId?: string } = {}) {
  const { data: classesRes } = useGetClassesQuery({ page: 1, limit: 100000 });
  const classes = classesRes?.data || [];
  const params = useParams();
  const id = mentorId || params.id;
  const { data: mentorDetails } = useGetMentorQuery({ id });

  const { setValue } = useFormContext<ProfileFormData>();

  const [selected, setSelected] = useState<
    {
      class_id: string;
      price: number;
      subject: { subject_id: string; subject_price: number }[];
    }[]
  >([]);

  useEffect(() => {
    if (!mentorDetails?.data?.selected_class) return;

    const formatted = mentorDetails.data.selected_class.map((cls) => ({
      class_id: cls.class_id._id,
      price: Number(cls.price) || 0,
      subject: cls.subject.map((sub) => ({
        subject_id: sub.subject_id._id,
        subject_price: Number(sub.subject_price) || 0,
      })),
    }));

    setSelected(formatted);
  }, [mentorDetails]);

  useEffect(() => {
    setValue("selected_class", selected, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selected]);

   const toggleClass = (classId: string) => {
  setSelected((prev) => {
    const exists = prev.find((c) => c.class_id === classId);

    if (exists) {
      // Remove class
      return prev.filter((c) => c.class_id !== classId);
    }

    // Add class WITH correct price (not zero)
    const apiClass = classes.find((c) => c._id === classId);

    return [
      ...prev,
      {
        class_id: classId,
        price: apiClass?.basePrice ?? 0, // FIXED
        subject: [],
      },
    ];
  });
};

  const toggleSubject = (
    classId: string,
    subjectId: string,
    subjectPrice: number
  ) => {
    setSelected((prev) =>
      prev.map((cls) => {
        if (cls.class_id !== classId) return cls;

        const exists = cls.subject.find((s) => s.subject_id === subjectId);

        let updatedSubjects;

        if (exists) {
          updatedSubjects = cls.subject.filter(
            (s) => s.subject_id !== subjectId
          );
        } else {
          updatedSubjects = [
            ...cls.subject,
            { subject_id: subjectId, subject_price: subjectPrice },
          ];
        }

        return { ...cls, subject: updatedSubjects };
      })
    );
  };

  const updateSubjectPrice = (
    classId: string,
    subjectId: string,
    newPrice: number
  ) => {
    setSelected((prev) =>
      prev.map((cls) => {
        if (cls.class_id !== classId) return cls;

        const updatedSubjects = cls.subject.map((sub) =>
          sub.subject_id === subjectId
            ? { ...sub, subject_price: newPrice }
            : sub
        );

        return { ...cls, subject: updatedSubjects };
      })
    );
  };

  const isClassSelected = (classId: string) => {
    return selected.some((c) => c.class_id === classId);
  };

  const isSubjectSelected = (classId: string, subjectId: string) => {
    const cls = selected.find((c) => c.class_id === classId);
    return cls?.subject.some((s) => s.subject_id === subjectId) ?? false;
  };

  return (
    <div>
      <div>
        <section>
          <h2 className="text-lg font-semibold mb-4">Subjects per Class</h2>

          {classes.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No classes are available yet. An administrator needs to add Classes and
              Subjects before you can pick what you teach. You can skip this step for
              now and come back later.
            </div>
          )}

          <div className="space-y-4">
            {classes.map((cls) => (
              <div key={cls._id} className="border   p-4 rounded-lg">
                {/* ---- CLASS CHECKBOX ---- */}
                <label className="flex items-center   justify-between cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={isClassSelected(cls._id)}
                      onChange={() => toggleClass(cls._id)}
                    />
                    <span className="ml-3 text-blue-900 font-medium">
                      {cls.class} - {cls.syllabus}
                    </span>
                  </div>
                  <Input
                    placeholder="Enter base price"
                    type="number"
                    value={
                      selected.find((c) => c.class_id === cls._id)?.price ?? cls.basePrice
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value) ||  cls.basePrice;
                      setSelected((prev) =>
                        prev.map((c) =>
                          c.class_id === cls._id ? { ...c, price: val } : c
                        )
                      );
                    }}
                  />
                </label>

                {/* ---- SUBJECTS ---- */}
                {isClassSelected(cls._id) && (
                  <div className="mt-4 space-y-2 ml-8  ">
                    {cls.subjects.map((sub) => (
                      <label
                        key={sub.subjectId._id}
                        className="flex items-center  border-2 p-2 justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3  ">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={isSubjectSelected(
                              cls._id,
                              sub.subjectId._id
                            )}
                            onChange={() =>
                              toggleSubject(
                                cls._id,
                                sub.subjectId._id,
                                Number(sub.price)
                              )
                            }
                          />
                          <span className="text-gray-700 capitalize">
                            {sub.subjectId.name}
                          </span>
                        </div>

                        <Input
                          placeholder="Enter base price"
                          value={
                            selected
                              .find((c) => c.class_id === cls._id)
                              ?.subject.find(
                                (s) => s.subject_id === sub.subjectId._id
                              )?.subject_price ?? sub.price
                          }
                          type="number"
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            updateSubjectPrice(cls._id, sub.subjectId._id, val);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
