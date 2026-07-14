import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useReferralQuery } from "@/api/referral/referral-api";

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ReferPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useReferralQuery(user?.id);

  const code = data?.referralCode ?? "";
  const shareText = `Join me on Scholar Hub! Use my referral code ${code} when you sign up. https://www.scholarhub.live`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Scholar Hub", text: shareText });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Invite copied to clipboard");
      } catch {
        toast.error("Couldn't share");
      }
    }
  };

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Refer &amp; Earn</h1>
          <p className="text-sm text-muted-foreground">
            Share your code — you both earn when your friend completes their first booking.
          </p>
        </div>

        <Card className="bg-brand-gradient text-white">
          <CardContent className="py-6">
            {isLoading ? (
              <Skeleton className="h-10 w-48 bg-white/30" />
            ) : (
              <>
                <div className="text-sm text-white/80">Your referral code</div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-3xl font-bold tracking-widest">{code || "—"}</span>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={copyCode}
                    disabled={!code}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="secondary" className="mt-4" onClick={share} disabled={!code}>
                  <Share2 className="mr-2 h-4 w-4" /> Share invite
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Friends referred
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.referralCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reward balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data?.rewardBalance ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4" /> People you've referred
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Failed to load referrals.</div>
            ) : (data?.referredUsers?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No referrals yet. Share your code to get started!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.referredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium capitalize">
                        {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="text-right">{fmtDate(u.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReferPage;
