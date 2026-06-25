import { ProfileFormData } from "@/types/profilePage";
import { TimePicker } from "@mui/x-date-pickers";

import { Plus, Pencil, Trash2, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import dayjs from "dayjs";

type TimeSlotItem = {
  time: Date | null;
  isEditing: boolean;
};

type TimeSlotProps = {
  time:string,
_id:string
};

const TimeSlot = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>([]);
  const { watch, setValue } = useFormContext<ProfileFormData>();

  // Load saved slots from form on mount
  useEffect(() => {
    const savedSlots = watch("available_slot") || [];

    const initialSlots = savedSlots.map((slot: TimeSlotProps) => (
        
        
        {
      time: new Date(slot.time),
      isEditing: false,
    }));

    setTimeSlots(initialSlots);
  }, []);

  // Sync timeSlots to form state whenever it changes
  useEffect(() => {
    const cleanedSlots = timeSlots
      .filter((slot) => slot.time !== null)
      .map((slot) => ({ time: slot.time!.toISOString() }));

    setValue("available_slot", cleanedSlots);
  }, [timeSlots, setValue]);

  const addTimeSlot = () =>
    setTimeSlots([...timeSlots, { time: null, isEditing: true }]);

  const removeTimeSlot = (index: number) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTimeSlotValue = (index: number, value: Date | null) => {
    const updated = [...timeSlots];
    updated[index].time = value;
    setTimeSlots(updated);
  };

  const toggleEdit = (index: number, value: boolean) => {
    const updated = [...timeSlots];
    updated[index].isEditing = value;
    setTimeSlots(updated);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-900">Time Slots</h2>
        <button
          onClick={addTimeSlot}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      <div className="space-y-3">
        {timeSlots.map((slot, index) => (
          <div key={index} className="flex items-center gap-4">
            {slot.isEditing ? (
              <TimePicker
                label="Pick time"
                className="w-full"
                value={slot.time}
                onChange={(value) => updateTimeSlotValue(index, value)}
              />
            ) : (
              <div className="w-full border px-4 py-2 rounded text-gray-700 bg-gray-100">
                {slot.time ? dayjs(slot.time).format("hh:mm A") : "No time selected"}
              </div>
            )}

            <div className="flex items-center gap-2">
              {slot.isEditing ? (
                <button
                  onClick={() => toggleEdit(index, false)}
                  className="p-2 bg-green-200 rounded-full hover:bg-green-300"
                  title="Save"
                >
                  <Save className="w-4 h-4 text-green-700" />
                </button>
              ) : (
                <button
                  onClick={() => toggleEdit(index, true)}
                  className="p-2 bg-blue-200 rounded-full hover:bg-blue-300"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-blue-700" />
                </button>
              )}
              <button
                onClick={() => removeTimeSlot(index)}
                className="p-2 bg-red-200 rounded-full hover:bg-red-300"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-700" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimeSlot;
