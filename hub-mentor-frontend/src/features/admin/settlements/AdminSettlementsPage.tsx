import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";
import {
  useSettlementsQuery,
  useCreateSettlementMutation,
  useVoidSettlementMutation,
  type PendingByMentor,
  type SettlementRecord,
} from "@/api/settlements/settlements-api";

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

const METHODS = ["bank-transfer", "upi", "cash", "other"] as const;
type Method = (typeof METHODS)[number];

const AdminSettlementsPage = () => {
  const { data, isLoading, isError } = useSettlementsQuery({ limit: 20 });
  const createSettlement = useCreateSettlementMutation();
  const voidSettlement = useVoidSettlementMutation();

  const pending = data?.pendingByMentor ?? [];
  const settlements = data?.settlements ?? [];

  // Settle dialog
  const [settling, setSettling] = useState<PendingByMentor | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("bank-transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [voiding, setVoiding] = useState<SettlementRecord | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const openSettle = (m: PendingByMentor) => {
    const initial: Record<string, boolean> = {};
    m.invoices.forEach((i) => (initial[i._id] = true));
    setChecked(initial);
    setMethod("bank-transfer");
    setReference("");
    setNote("");
    setSettling(m);
  };

  // Keep the amount in sync with the checked invoices (editable afterward).
  useEffect(() => {
    if (!settling) return;
    const sum = settling.invoices
      .filter((i) => checked[i._id])
      .reduce((acc, i) => acc + i.amount, 0);
    setAmount(String(sum));
  }, [checked, settling]);

  const selectedIds = settling
    ? settling.invoices.filter((i) => checked[i._id]).map((i) => i._id)
    : [];

  const submitSettle = () => {
    if (!settling || selectedIds.length === 0) return;
    createSettlement.mutate(
      {
        mentorId: settling._id,
        invoiceIds: selectedIds,
        amount: amount === "" ? undefined : Number(amount),
        method,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      },
      { onSuccess: () => setSettling(null) },
    );
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settlements</h1>
          <p className="text-sm text-muted-foreground">
            Pay mentors for collected invoices. Payouts are recorded manually —
            no platform commission.
          </p>
        </div>

        {/* Owed to mentors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owed to mentors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                Failed to load settlements.
              </div>
            ) : pending.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                Nothing pending payout. 🎉
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Owed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell className="font-medium capitalize">
                        {m.mentorName || "Mentor"}
                      </TableCell>
                      <TableCell>{m.invoices.length}</TableCell>
                      <TableCell className="font-semibold">
                        {money(m.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => openSettle(m)}>
                          <Wallet className="mr-1.5 h-4 w-4" /> Settle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payout history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payout history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : settlements.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No payouts recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement #</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Paid on</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-mono text-xs">
                        {s.settlementNumber}
                      </TableCell>
                      <TableCell className="capitalize">{s.mentorName}</TableCell>
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
                      <TableCell className="font-semibold">
                        {money(s.amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-1 text-xs font-semibold",
                            s.status === "recorded"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {s.status === "recorded" ? "Recorded" : "Void"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === "recorded" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVoidReason("");
                              setVoiding(s);
                            }}
                          >
                            Void
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settle dialog */}
      <Dialog open={!!settling} onOpenChange={(open) => !open && setSettling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Pay {settling?.mentorName || "mentor"}
            </DialogTitle>
            <DialogDescription>
              Select the invoices this payout covers and enter the amount paid.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
              {settling?.invoices.map((i) => (
                <label
                  key={i._id}
                  className="flex cursor-pointer items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={!!checked[i._id]}
                      onChange={(e) =>
                        setChecked((c) => ({ ...c, [i._id]: e.target.checked }))
                      }
                    />
                    <span className="font-mono text-xs">{i.invoiceNumber}</span>
                  </div>
                  <span className="font-medium">{money(i.amount)}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stl-amount">Amount paid (₹)</Label>
              <Input
                id="stl-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stl-ref">Reference</Label>
                <Input
                  id="stl-ref"
                  placeholder="UTR / UPI ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stl-note">Note (optional)</Label>
              <Textarea
                id="stl-note"
                className="resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettling(null)}>
              Cancel
            </Button>
            <Button
              disabled={selectedIds.length === 0 || createSettlement.isPending}
              onClick={submitSettle}
            >
              Record payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void dialog */}
      <Dialog open={!!voiding} onOpenChange={(open) => !open && setVoiding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void this settlement?</DialogTitle>
            <DialogDescription>
              Its invoices return to “collected” (paid). A short reason is
              optional.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)…"
            className="resize-none"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiding(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={voidSettlement.isPending}
              onClick={() =>
                voiding &&
                voidSettlement.mutate(
                  { settlementId: voiding._id, reason: voidReason.trim() || undefined },
                  { onSuccess: () => setVoiding(null) },
                )
              }
            >
              Void settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSettlementsPage;
