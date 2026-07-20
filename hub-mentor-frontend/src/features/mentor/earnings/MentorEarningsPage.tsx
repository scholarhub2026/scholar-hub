import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMentorInvoicesQuery } from "@/api/invoices/invoices-api";
import { useMentorSettlementsQuery } from "@/api/settlements/settlements-api";

const money = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const INVOICE_CHIP: Record<string, string> = {
  payment_due: "bg-amber-50 text-amber-600",
  paid: "bg-emerald-50 text-emerald-600",
  settled: "bg-blue-50 text-blue-600",
};
const INVOICE_LABEL: Record<string, string> = {
  payment_due: "Due",
  paid: "Collected",
  settled: "Settled",
};

const MentorEarningsPage = () => {
  const invoicesQuery = useMentorInvoicesQuery();
  const settlementsQuery = useMentorSettlementsQuery();

  const invoices = invoicesQuery.data?.invoices ?? [];
  const summary = invoicesQuery.data?.summary;
  const settlements = settlementsQuery.data?.settlements ?? [];
  const isLoading = invoicesQuery.isLoading || settlementsQuery.isLoading;

  const stats = [
    { label: "Billed", value: money(summary?.billed ?? 0) },
    { label: "Collected", value: money(summary?.collected ?? 0) },
    { label: "Paid out to you", value: money(settlementsQuery.data?.totalReceived ?? 0) },
  ];

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-sm text-muted-foreground">
            Invoices billed for your classes and payouts you've received.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{s.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No invoices yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell className="font-mono text-xs">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="capitalize">{inv.studentName}</TableCell>
                      <TableCell>{inv.periodLabel}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-1 text-xs font-semibold",
                            INVOICE_CHIP[inv.status] ?? "bg-slate-100 text-slate-600",
                          )}
                        >
                          {INVOICE_LABEL[inv.status] ?? inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {money(inv.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payouts received</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : settlements.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No payouts yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-mono text-xs">
                        {s.settlementNumber}
                      </TableCell>
                      <TableCell className="capitalize">
                        {s.method}
                        {s.reference ? (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            · {s.reference}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{fmtDate(s.paidAt)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {money(s.amount)}
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
