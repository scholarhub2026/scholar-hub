import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/auth/AuthProvider";
import { useMentorEarningsQuery } from "@/api/mentor/earnings-api";

const money = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const MentorEarningsPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useMentorEarningsQuery(user?.id);

  const stats = [
    { label: "Total Earnings", value: money(data?.totalEarnings ?? 0) },
    { label: "This Month", value: money(data?.thisMonthEarnings ?? 0) },
    { label: "Pending", value: money(data?.pendingEarnings ?? 0) },
    { label: "Paid Sessions", value: String(data?.totalSessions ?? 0) },
  ];

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-sm text-muted-foreground">
            Paid sessions across your bookings.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{s.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Failed to load earnings.</div>
            ) : (data?.recent?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No paid sessions yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.recent.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium capitalize">
                        {t.studentName || "—"}
                      </TableCell>
                      <TableCell className="capitalize">{t.bookingType || "—"}</TableCell>
                      <TableCell>
                        {t.sessionMode ? (
                          <Badge variant="outline" className="capitalize">
                            {t.sessionMode}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{fmtDate(t.createdAt)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {money(t.totalAmount)}
                      </TableCell>
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

export default MentorEarningsPage;
