import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaginationControl from "@/components/ui/PaginationController";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useSetUserStatusMutation,
  type CreateUserInput,
} from "@/api/admin/users-api";
import type { Role } from "@/config/roles";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  TUTOR: "secondary",
  STUDENT: "outline",
};

const emptyForm: CreateUserInput = {
  email: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  role: "ADMIN" as Role,
  password: "",
};

const CreateUserDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const createUser = useCreateUserMutation();

  const submit = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.password) {
      toast.error("Email, name and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    await createUser.mutateAsync(form);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone (optional)</Label>
            <Input
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TUTOR">Mentor</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Temporary password</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="At least 6 characters"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={createUser.isPending}>
            {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const setStatus = useSetUserStatusMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useGetUsersQuery({
    page,
    limit: 10,
    role: role === "ALL" ? undefined : role,
    search: debounced || undefined,
  });

  const users = data?.data ?? [];

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground">
              All accounts. Create staff/admins and enable or disable access.
            </p>
          </div>
          <CreateUserDialog />
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="TUTOR">Mentor</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
            </SelectContent>
          </Select>
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
              <div className="p-8 text-center text-red-500">Failed to load users.</div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No users match your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-24">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium capitalize">
                        {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phoneNumber || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[u.role] ?? "outline"}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.isActive}
                          onCheckedChange={(v) =>
                            setStatus.mutate({ id: u._id, isActive: v })
                          }
                        />
                      </TableCell>
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

export default AdminUsersPage;
