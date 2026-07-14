import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationControl from "@/components/ui/PaginationController";
import { useReferralOverviewQuery } from "@/api/admin/referrals-api";

const AdminReferralsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useReferralOverviewQuery({ page, limit: 10 });
  const rows = data?.data ?? [];
  const summary = data?.summary ?? { totalReferrals: 0, totalRewards: 0 };

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-sm text-muted-foreground">
            Refer &amp; earn activity across all accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reward Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{summary.totalRewards}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                Failed to load referral data.
              </div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No referrals yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="w-24 text-center">Referred</TableHead>
                    <TableHead className="w-32 text-right">Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium capitalize">
                        {`${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "—"}
                      </TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {r.referralCode ? (
                          <Badge variant="secondary">{r.referralCode}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-center">{r.referralCount}</TableCell>
                      <TableCell className="text-right">₹{r.rewardBalance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <PaginationControl
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminReferralsPage;
