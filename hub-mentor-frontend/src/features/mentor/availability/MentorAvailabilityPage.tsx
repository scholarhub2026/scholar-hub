import { useEffect, useState } from "react";
import dayjs from "dayjs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Loader2, Plus, X } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/auth/AuthProvider";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { useUpdateAvailabilityMutation } from "@/api/mentor/availability-api";

// Slots are stored as ISO datetime strings so the student-facing profile can
// render them with moment/dayjs (…format("LT") -> "10:00 AM").
const timeToISO = (hhmm: string): string => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const fmtSlot = (iso: string): string => {
  const d = dayjs(iso);
  return d.isValid() ? d.format("h:mm A") : iso; // fallback for legacy free-text
};
const hhmmOf = (iso: string): string => {
  const d = dayjs(iso);
  return d.isValid() ? d.format("HH:mm") : "";
};

const MentorAvailabilityPage = () => {
  const { user } = useAuth();
  const mentorId = user?.id;
  const { data, isLoading } = useGetMentorQuery({ id: mentorId });
  const save = useUpdateAvailabilityMutation();

  const [isAvailable, setIsAvailable] = useState(true);
  const [slots, setSlots] = useState<string[]>([]); // ISO strings
  const [newTime, setNewTime] = useState("");

  // Hydrate from the mentor doc once it loads.
  useEffect(() => {
    const mentor = data?.data;
    if (!mentor) return;
    setIsAvailable(mentor.is_available !== false);
    const existing: string[] = Array.isArray(mentor.available_slot)
      ? mentor.available_slot.map((s: { time?: string }) => s?.time ?? "").filter(Boolean)
      : [];
    setSlots(existing);
  }, [data]);

  const addSlot = () => {
    if (!newTime) return;
    const alreadyThere = slots.some((s) => hhmmOf(s) === newTime);
    if (!alreadyThere) {
      setSlots((prev) =>
        [...prev, timeToISO(newTime)].sort(
          (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf(),
        ),
      );
    }
    setNewTime("");
  };

  const removeSlot = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const onSave = () => {
    if (!mentorId) return;
    save.mutate({
      id: mentorId,
      data: {
        is_available: isAvailable,
        available_slot: slots.map((time) => ({ time })),
      },
    });
  };

  return (
    <DashboardLayout userRole="mentor">
      <PageHeader
        title="Availability"
        description="Set whether you're taking bookings and the times students can book you."
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

            <Card className="rounded-xl border-slate-200/80 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-4">
                <CardTitle className="font-display text-base">Time slots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 py-5">
                {/* Add a slot */}
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Add a time</Label>
                    <Input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSlot())}
                      className="w-44"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addSlot} disabled={!newTime}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add slot
                  </Button>
                </div>

                {/* Slot chips */}
                {slots.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                    No time slots yet. Add the times you're available above.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pl-3 pr-1.5 text-sm font-medium text-primary"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {fmtSlot(s)}
                        <button
                          type="button"
                          onClick={() => removeSlot(i)}
                          className="ml-0.5 rounded-full p-0.5 text-primary/70 transition hover:bg-primary/20 hover:text-primary"
                          aria-label="Remove slot"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={onSave} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorAvailabilityPage;
