import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Role } from "@/config/roles";

export type AdminUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  isActive: boolean;
  emailVerified?: boolean;
  completed_profile?: boolean;
  createdAt?: string;
};

export type UsersResponse = {
  data: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UsersQuery = {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
};

export type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: Role;
  password: string;
};

const USERS_KEY = "admin-users";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

export const useGetUsersQuery = (params: UsersQuery) =>
  useQuery<UsersResponse>({
    queryKey: [USERS_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 10));
      if (params.role) q.set("role", params.role);
      if (params.search) q.set("search", params.search);
      return (await axiosInstance.get(`/users?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

export const useCreateUserMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) =>
      (await axiosInstance.post("/users", input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success("User created");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to create user")),
  });
};

export const useSetUserStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await axiosInstance.put(`/users/${id}/status`, { isActive })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
    onError: (e) => toast.error(errMessage(e, "Failed to update status")),
  });
};
