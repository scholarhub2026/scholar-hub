import React, { useState } from "react";
import { ChevronDown, X, Filter } from "lucide-react";
import { useGetClassesQuery } from "@/api/class/get-classess";
import { useGetSubjectQuery } from "@/api/subject/get-subject";

// Mock data for demonstration
const levels = [
  { label: "CBSE", value: "CBSE" },
  { label: "ICSE", value: "ICSE" },
  { label: "SCERT", value: "SCERT" },
];

const Label = ({ children, className = "" }) => (
  <label className={`text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
}) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const CustomDropdown = ({
  triggerLabel,
  items,
  multiple = false,
  onSelect,
  selectedValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(selectedValue || null);

  const handleSelect = (item) => {
    setSelected(item);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const displayText = selected ? selected.label : triggerLabel;

  return (
    <div className="relative">
      <button
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`block truncate capitalize ${
            !selected ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {displayText}
        </span>
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {items.map((item) => (
            <button
              key={item.value}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
              onClick={() => handleSelect(item)}
            >
              <span className="block truncate text-gray-900 capitalize">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ResponsiveFilterSection({ filterData, setFilterData }) {
  const { data: classesData } = useGetClassesQuery({
    limit: 10000,
    page: 1,
  });

  const { data: subjectData } = useGetSubjectQuery({
    subjectType: "subject",
    limit: 10000,
    page: 1,
  });

 

  const classes =
    classesData?.data
      ?.filter((cls) =>
        filterData.syllabus
          ? cls.syllabus.toLowerCase() ===
            filterData.syllabus.value.toLowerCase()
          : true
      )
      ?.map((cls) => ({
        label: cls.class,
        value: cls._id,
        subjects:cls.subjects
      })) || [];

     
      

const subjects = subjectData?.data
  ?.filter((sub) => {
    if (!filterData.classes) return true;
    return filterData.classes.subjects?.some((s) => s.subjectId?._id === sub._id);
  })
  ?.map((sub) => ({
    label: sub.name,
    value: sub._id,
  })) || [];


  const handleApplyFilters = () => {
    console.log("Applying filters:", {
      syllabus: filterData.syllabus,
      class: filterData.classes,
      subject: filterData.subjects,
    });
  };

  const handleClearFilters = () => {
    setFilterData({
      syllabus: null,
      classes: null,
      subjects: null,
    });
    console.log("Filters cleared");
  };

  const hasFilters =
    filterData.syllabus || filterData.classes || filterData.subjects;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label className="block">Select Syllabus</Label>
          <CustomDropdown
            triggerLabel="Choose Syllabus"
            items={levels}
            onSelect={(item) =>
              setFilterData((prev) => ({ ...prev, syllabus: item }))
            }
            selectedValue={filterData.syllabus}
          />
        </div>

        <div className="space-y-2">
          <Label className="block">Select Class</Label>
          <CustomDropdown
            triggerLabel="Choose Class"
            items={classes}
            onSelect={(item) =>
              setFilterData((prev) => ({ ...prev, classes: item }))
            }
            selectedValue={filterData.classes}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="block">Select Subject</Label>
            <Label className="block text-sm text-red-400">
              Only for specific subject class
            </Label>
          </div>
          <CustomDropdown
            triggerLabel="Choose Subject"
            items={subjects}
            onSelect={(item) =>
              setFilterData((prev) => ({ ...prev, subjects: item }))
            }
            selectedValue={filterData.subjects}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>
            {filterData.syllabus && (
              <span className="inline-flex capitalize items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filterData.syllabus.label}
                <button
                  onClick={() =>
                    setFilterData((prev) => ({ ...prev, syllabus: null }))
                  }
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterData.classes && (
              <span className="inline-flex capitalize items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filterData.classes.label}
                <button
                  onClick={() =>
                    setFilterData((prev) => ({ ...prev, classes: null }))
                  }
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterData.subjects && (
              <span className="inline-flex items-center px-3 py-1 capitalize rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {filterData.subjects.label}
                <button
                  onClick={() =>
                    setFilterData((prev) => ({ ...prev, subjects: null }))
                  }
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="primary"
          className="flex-1 sm:flex-none"
          onClick={handleApplyFilters}
          disabled={!hasFilters}
        >
          Apply Filters
        </Button>
        <Button
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={handleClearFilters}
          disabled={!hasFilters}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
