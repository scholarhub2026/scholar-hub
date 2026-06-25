import React, { useEffect } from "react";

const Booking = ({ mentor, setFormData, formData }) => {
  

  // ✅ Calculate subject total
  const subjectPriceTotal = formData.selectedClass
    ? formData.selectedClass.subject
        .filter((s) => formData.selectedSubjects.includes(s.subject_id._id))
        .reduce((acc, s) => acc + s.subject_price, 0)
    : 0;

  // ✅ Compute totalAmount once
  const totalAmount =
    formData.bookingType === "full"
      ? formData.selectedClass?.price || 0
      : subjectPriceTotal;

  // ✅ Keep formData.totalAmount in sync
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalAmount,
    }));
  }, [totalAmount, setFormData]);

  if (!mentor) return <p>No mentor data available</p>;

  // Unique syllabus list
  const syllabusList = [
    ...new Set(
      mentor.selected_class
        .map((item) => item.class_id.syllabus)
        .filter(Boolean)
    ),
  ];

  const filteredClasses = formData.selectedSyllabus
    ? mentor.selected_class.filter(
        (item) => item.class_id.syllabus === formData.selectedSyllabus
      )
    : [];

  const toggleSubject = (subject) => {
    if (formData.bookingType === "individual") {
      setFormData((prev) => ({ ...prev, selectedSubjects: [subject._id] }));
    } else {
      if (formData.selectedSubjects.includes(subject._id)) {
        setFormData((prev) => ({
          ...prev,
          selectedSubjects: prev.selectedSubjects.filter(
            (s) => s !== subject._id
          ),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          selectedSubjects: [...prev.selectedSubjects, subject._id],
        }));
      }
    }
  };

  // Validation: Require at least one subject for individual or multiple
  const isSubjectRequired =
    formData.bookingType === "individual" ||
    formData.bookingType === "multiple";

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* 1. Syllabus Selection */}
      <div>
        <h2 className="text-xl font-bold mb-2">Select Syllabus</h2>
        <select
          className="border uppercase rounded-lg px-4 py-2 w-full mb-4"
          value={formData.selectedSyllabus}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              selectedSyllabus: e.target.value,
              selectedClass: null,
              bookingType: "",
              selectedSubjects: [],
            }));
          }}
        >
          <option className="uppercase" value="">-- Choose Syllabus --</option>
          {syllabusList.map((syllabus:string, idx:number) => (
            <option className="uppercase" key={idx} value={syllabus}>
              {syllabus}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Class Selection */}
      {formData.selectedSyllabus && (
        <div>
          <h2 className="text-xl font-bold mb-2">Select Class</h2>
          <ul className="space-y-2">
            {filteredClasses.map((cls,index) => (
              <li
                key={index}
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    selectedClass: cls,
                    bookingType: "",
                    selectedSubjects: [],
                  }));
                }}
                className={`border rounded-lg p-3 cursor-pointer hover:shadow-md capitalize ${
                  formData.selectedClass?.class_id._id === cls.class_id._id
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white"
                }`}
              >
                <p className="font-bold">{cls.class_id.class}</p>
                <p className="text-gray-600">Price: ₹{cls.price}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Booking Type */}
      {formData.selectedClass && (
        <div>
          <h2 className="text-xl font-bold mb-2">Booking Type</h2>
          <select
            className="border rounded-lg px-4 py-2 w-full mb-4"
            value={formData.bookingType}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                bookingType: e.target.value,
                selectedSubjects: [],
              }));
            }}
          >
            <option value="">-- Select Type --</option>
            <option value="full">Full Class</option>
            <option value="individual">Individual Subject</option>
            <option value="multiple">Multiple Subjects</option>
          </select>
        </div>
      )}

      {/* 4. Subjects Selection */}
      {formData.selectedClass &&
        (formData.bookingType === "individual" ||
          formData.bookingType === "multiple") && (
          <div>
            <h2 className="text-xl font-bold mb-2">Select Subject(s)</h2>
            <ul className="space-y-2">
              {formData.selectedClass.subject.map((sub) => (
                <li key={sub.subject_id._id} className="capitalize">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type={
                        formData.bookingType === "individual"
                          ? "radio"
                          : "checkbox"
                      }
                      name="subject"
                      checked={formData.selectedSubjects.includes(
                        sub.subject_id._id
                      )}
                      onChange={() => toggleSubject(sub.subject_id)}
                    />
                    <span>
                      {sub.subject_id.name} – ₹{sub.subject_price}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {isSubjectRequired && formData.selectedSubjects.length === 0 && (
              <p className="text-red-500 mt-2">
                Please select at least one subject.
              </p>
            )}
          </div>
        )}

       {/* 5. Single Display for Total Price */}
      {formData.totalAmount > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-green-50">
          <p className="font-semibold">Total Price: ₹{formData.totalAmount}</p>
        </div>
      )}
    </div>
   
  );
};

export default Booking;
