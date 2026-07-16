import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/auth/AuthProvider";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import {
  useUpdateAvailabilityMutation,
  type WeeklySlot,
} from "@/api/mentor/availability-api";

// Rendered Monday-first; value is the JS/getDay() weekday (0=Sun … 6=Sat).
const DAYS: Array<[number, string]> = [
  [1, "Monday"],
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
  [6, "Saturday"],
  [0, "Sunday"],
];

const MentorAvailabilityPage = () => {
  const { user } = useAuth();
  const mentorId = user?.id;
  const { data, isLoading } = useGetMentorQuery({ id: mentorId });
  const save = useUpdateAvailabilityMutation();

  const [isAvailable, setIsAvailable] = useState(true);
  const [slots, setSlots] = useState<WeeklySlot[]>([]);

  // Hydrate from the mentor doc once it loads.
  useEffect(() => {
    const mentor = data?.data;
    if (!mentor) return;
    setIsAvailable(mentor.is_available !== false);
    const existing: WeeklySlot[] = Array.isArray(mentor.weekly_availability)
      ? mentor.weekly_availability.map((s: WeeklySlot) => ({
          _id: s._id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: s.capacity ?? 1,
          isActive: s.isActive !== false,
        }))
      : [];
    setSlots(existing);
  }, [data]);

  const addSlot = (dayOfWeek: number) =>
    setSlots((prev) => [
      ...prev,
      { dayOfWeek, startTime: "18:00", endTime: "19:00", capacity: 1, isActive: true },
    ]);

  const updateSlot = (index: number, patch: Partial<WeeklySlot>) =>
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeSlot = (index: number) =>
    setSlots((prev) => prev.filter((_, i) => i !== index));

  const onSave = () => {
    if (!mentorId) return;
    save.mutate({
      id: mentorId,
      data: { is_available: isAvailable, weekly_availability: slots },
    });
  };

  return (
    <DashboardLayout userRole="mentor">
      <PageHeader
        title="Weekly Availability"
        description="Set the time ranges you teach each day. Leave a day empty to be off (e.g. weekends). Students book the slots you add here."
      />

      <div className="max-w-2xl space-y-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <Card className="rounded-xl border-slate-200/80 shadow-sm">
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <div className="font-semibold text-slate-800">Accepting bookings</div>
                  <p className="text-sm text-slate-500">
                    When off, students can't book new sessions with you.
                  </p>
                </div>
                <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
              </CardContent>
            </Card>

            {DAYS.map(([day, label]) => {
              const daySlots = slots
                .map((s, i) => ({ s, i }))
                .filter((x) => x.s.dayOfWeek === day)
                .sort((a, b) => a.s.startTime.localeCompare(b.s.startTime));
              return (
                <Card key={day} className="rounded-xl border-slate-200/80 shadow-sm">
                  <CardContent className="space-y-3 py-5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800">{label}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addSlot(day)}
                      >
                        <Plus className="mr-1.5 h-4 w-4" /> Add time
                      </Button>
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-sm text-slate-400">Off — no slots</p>
                    ) : (
                      daySlots.map(({ s, i }) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3"
                        >
                          <Input
                            type="time"
                            value={s.startTime}
                            onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                            className="w-32"
                          />
                          <span className="text-slate-400">to</span>
                          <Input
                            type="time"
                            value={s.endTime}
                            onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                            className="w-32"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-500">Seats</span>
                            <Input
                              type="number"
                              min={1}
                              value={s.capacity}
                              onChange={(e) =>
                                updateSlot(i, {
                                  capacity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-20"
                            />
                            <span className="text-xs text-slate-400">
                              {s.capacity > 1 ? "group" : "1-on-1"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSlot(i)}
                            className="ml-auto rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label="Remove slot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end">
              <Button onClick={onSave} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save availability
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorAvailabilityPage;
