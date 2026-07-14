import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { useUpdateAvailabilityMutation } from "@/api/mentor/availability-api";

const MentorAvailabilityPage = () => {
  const { user } = useAuth();
  const mentorId = user?.id;
  const { data, isLoading } = useGetMentorQuery({ id: mentorId });
  const save = useUpdateAvailabilityMutation();

  const [isAvailable, setIsAvailable] = useState(true);
  const [slots, setSlots] = useState<string[]>([]);

  // Hydrate local editor state once the mentor doc loads.
  useEffect(() => {
    const mentor = data?.data;
    if (!mentor) return;
    setIsAvailable(mentor.is_available !== false);
    const existing: string[] = Array.isArray(mentor.available_slot)
      ? mentor.available_slot.map((s: { time?: string }) => s?.time ?? "").filter(Boolean)
      : [];
    setSlots(existing.length ? existing : [""]);
  }, [data]);

  const updateSlot = (i: number, value: string) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  const addSlot = () => setSlots((prev) => [...prev, ""]);
  const removeSlot = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const onSave = () => {
    if (!mentorId) return;
    const cleaned = slots.map((s) => s.trim()).filter(Boolean);
    save.mutate({
      id: mentorId,
      data: {
        is_available: isAvailable,
        available_slot: cleaned.map((time) => ({ time })),
      },
    });
  };

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Toggle whether you're taking bookings and manage your time slots.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <Card>
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <div className="font-medium">Accepting bookings</div>
                  <p className="text-sm text-muted-foreground">
                    When off, students can't book new sessions with you.
                  </p>
                </div>
                <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time slots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={slot}
                      placeholder="e.g. Mon 10:00–11:00 AM"
                      onChange={(e) => updateSlot(i, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={() => removeSlot(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addSlot}>
                  <Plus className="mr-2 h-4 w-4" /> Add slot
                </Button>
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
