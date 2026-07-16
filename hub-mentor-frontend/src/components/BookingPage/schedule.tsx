import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Repeat,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Circle,
  Sun,
} from "lucide-react";
import {
  useGetAvailabilityQuery,
  type AvailabilitySlotView,
} from "@/api/mentor/availability-api";

const DAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const todayKey = () => {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
};

type ReservedSlot = {
  slotId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  cadence: "recurring" | "single";
  date?: string;
};

const Schedule = ({ mentor, formData, setFormData }) => {
  const mentorId = mentor?._id ?? mentor?.id;
  const { data, isLoading } = useGetAvailabilityQuery(mentorId);
  const slots: AvailabilitySlotView[] = data?.slots ?? [];
  const cadence: "recurring" | "single" = formData.scheduleCadence || "recurring";
  const [pickedDate, setPickedDate] = useState<string>("");

  const selected: ReservedSlot[] = formData.reservedSlots ?? [];

  const setCadence = (c: "recurring" | "single") => {
    setFormData((prev) => ({ ...prev, scheduleCadence: c, reservedSlots: [], bookingDate: null }));
    setPickedDate("");
  };

  const isRecurringSelected = (slotId: string) =>
    selected.some((s) => s.slotId === slotId && s.cadence === "recurring");

  const isSingleSelected = (slotId: string, date: string) =>
    selected.some(
      (s) => s.slotId === slotId && s.cadence === "single" && s.date === date,
    );

  const toggleRecurring = (slot: AvailabilitySlotView) => {
    setFormData((prev) => {
      const list: ReservedSlot[] = prev.reservedSlots ?? [];
      const exists = list.some(
        (s) => s.slotId === slot._id && s.cadence === "recurring",
      );
      const next = exists
        ? list.filter((s) => !(s.slotId === slot._id && s.cadence === "recurring"))
        : [
            ...list,
            {
              slotId: slot._id!,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              cadence: "recurring" as const,
            },
          ];
      return { ...prev, reservedSlots: next, bookingDate: null };
    });
  };

  const toggleSingle = (slot: AvailabilitySlotView, date: string) => {
    setFormData((prev) => {
      const list: ReservedSlot[] = prev.reservedSlots ?? [];
      const exists = list.some(
        (s) => s.slotId === slot._id && s.cadence === "single" && s.date === date,
      );
      const next = exists
        ? list.filter(
            (s) => !(s.slotId === slot._id && s.cadence === "single" && s.date === date),
          )
        : [
            ...list,
            {
              slotId: slot._id!,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              cadence: "single" as const,
              date,
            },
          ];
      return { ...prev, reservedSlots: next, bookingDate: date };
    });
  };

  const onDateChange = (value: string) => {
    setPickedDate(value);
    // Only one date shown at a time; drop single picks from other dates.
    setFormData((prev) => ({ ...prev, reservedSlots: [], bookingDate: value || null }));
  };

  const slotRow = (
    slot: AvailabilitySlotView,
    checked: boolean,
    left: number,
    onClick: () => void,
  ) => {
    const disabled = left <= 0;
    const badge = disabled
      ? { text: "Full", cls: "bg-red-50 text-red-500" }
      : slot.capacity > 1
        ? { text: `${left} left`, cls: "bg-primary/10 text-primary" }
        : { text: "1-on-1", cls: "bg-green-50 text-green-600" };
    return (
      <button
        type="button"
        key={slot._id}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border p-3 text-left transition",
          disabled && "cursor-not-allowed opacity-60",
          checked
            ? "border-primary bg-primary/5 ring-1 ring-primary"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        )}
      >
        <span className="flex items-center gap-2.5">
          {checked ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300" />
          )}
          <span className="font-semibold text-slate-800">
            {slot.startTime}–{slot.endTime}
          </span>
        </span>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", badge.cls)}>
          {badge.text}
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          When would you like to learn?
        </h2>
        <p className="mt-1 text-slate-500">
          Pick a repeating weekly time or a one-off session — only the slots you need.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* Cadence toggle */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { c: "recurring" as const, icon: Repeat, title: "Weekly", sub: "Same time weekly" },
            { c: "single" as const, icon: Calendar, title: "Single session", sub: "One-off session" },
          ].map(({ c, icon: Icon, title, sub }) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-left transition",
                cadence === c
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <Icon className="h-5 w-5 text-primary" />
              <span>
                <span className="block font-semibold text-slate-800">{title}</span>
                <span className="block text-xs text-slate-500">{sub}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Payment frequency — fees are collected AFTER classes, no payment now */}
        <div>
          <div className="mb-1 font-semibold text-slate-900">How would you like to pay?</div>
          <p className="mb-3 text-xs text-slate-500">
            Fees are collected after classes — no payment now.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { f: "daily", icon: Sun, title: "Daily" },
              { f: "weekly", icon: Repeat, title: "Weekly" },
              { f: "monthly", icon: CalendarDays, title: "Monthly" },
            ].map(({ f, icon: Icon, title }) => (
              <button
                key={f}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, paymentFrequency: f }))
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition",
                  formData.paymentFrequency === f
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-slate-800">{title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Class start date (recurring only; single derives it from the session date) */}
        {cadence === "recurring" && (
          <div>
            <div className="mb-2 font-semibold text-slate-900">Class start date</div>
            <input
              type="date"
              min={todayKey()}
              value={formData.classStartDate ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  classStartDate: e.target.value || null,
                }))
              }
              className="h-11 w-full rounded-lg border border-slate-200 px-3"
            />
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-sm text-slate-400">Loading availability…</p>
        ) : slots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
            This mentor hasn't published availability yet.
          </p>
        ) : cadence === "recurring" ? (
          <div className="space-y-4">
            {DAY_ORDER.map((day) => {
              const daySlots = slots
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className="space-y-2">
                  <div className="text-sm font-bold text-slate-900">{DAY_LABEL[day]}</div>
                  {daySlots.map((slot) =>
                    slotRow(
                      slot,
                      isRecurringSelected(slot._id!),
                      slot.recurringRemaining,
                      () => toggleRecurring(slot),
                    ),
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="date"
              min={todayKey()}
              value={pickedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 px-3"
            />
            {pickedDate &&
              (() => {
                const jsDay = new Date(`${pickedDate}T00:00:00`).getDay();
                const daySlots = slots
                  .filter((s) => s.dayOfWeek === jsDay)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) {
                  return (
                    <p className="text-sm text-slate-400">
                      No slots on this day. Try another date.
                    </p>
                  );
                }
                return daySlots.map((slot) =>
                  slotRow(
                    slot,
                    isSingleSelected(slot._id!, pickedDate),
                    slot.recurringRemaining - (slot.dateHolds?.[pickedDate] ?? 0),
                    () => toggleSingle(slot, pickedDate),
                  ),
                );
              })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
