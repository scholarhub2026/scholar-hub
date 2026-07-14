import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PaginationControl from "@/components/ui/PaginationController";
import { Star, Trash2 } from "lucide-react";
import {
  mentorName,
  useDeleteReviewMutation,
  useGetAllReviewsQuery,
} from "@/api/admin/reviews-api";

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={
          i < rating ? "h-4 w-4 fill-yellow-400 text-yellow-400" : "h-4 w-4 text-gray-300"
        }
      />
    ))}
  </div>
);

const AdminReviewsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const deleteReview = useDeleteReviewMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useGetAllReviewsQuery({
    page,
    limit: 10,
    search: debounced || undefined,
  });
  const reviews = data?.data ?? [];

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Moderate mentor reviews. Deleting recomputes the mentor's rating.
          </p>
        </div>

        <Input
          className="max-w-xs"
          placeholder="Search student or comment…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Failed to load reviews.</div>
            ) : reviews.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No reviews yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-32">Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="w-16 text-right">Del</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{mentorName(r.mentorId)}</TableCell>
                      <TableCell className="capitalize">{r.studentName || "—"}</TableCell>
                      <TableCell>
                        <Stars rating={r.rating} />
                      </TableCell>
                      <TableCell className="max-w-md text-sm text-muted-foreground">
                        {r.comment || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The mentor's average rating will be recomputed. This can't
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteReview.mutate(r._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

export default AdminReviewsPage;
