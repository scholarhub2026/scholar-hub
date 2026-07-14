import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateAdMutation,
  useDeleteAdMutation,
  useGetAllAdsQuery,
  useUpdateAdMutation,
  type Ad,
  type AdInput,
} from "@/api/ad/ad-api";
import { useUploadMediaMutation } from "@/api/upload/upload-image";

type FormState = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  order: 0,
  isActive: true,
};

const AdFormDialog = ({
  trigger,
  initial,
  onSubmit,
  submitting,
  title,
}: {
  trigger: React.ReactNode;
  initial?: Ad;
  onSubmit: (data: AdInput) => Promise<unknown>;
  submitting: boolean;
  title: string;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          title: initial.title,
          imageUrl: initial.imageUrl,
          linkUrl: initial.linkUrl ?? "",
          order: initial.order,
          isActive: initial.isActive,
        }
      : emptyForm,
  );
  const { mutate: uploadMedia, isPending: uploading } = useUploadMediaMutation();

  const handleUpload = (file?: File) => {
    if (!file) return;
    uploadMedia(file, {
      onSuccess: (data: { url: string }) => {
        setForm((f) => ({ ...f, imageUrl: data.url }));
        toast.success("Image uploaded");
      },
      onError: () => toast.error("Image upload failed"),
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Title and image are required");
      return;
    }
    await onSubmit({
      title: form.title.trim(),
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim(),
      order: Number(form.order) || 0,
      isActive: form.isActive,
    });
    setOpen(false);
    if (!initial) setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ad-title">Title</Label>
            <Input
              id="ad-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Summer scholarship drive"
            />
          </div>

          <div className="space-y-2">
            <Label>Banner image</Label>
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Banner preview"
                className="h-28 w-full rounded-md object-cover border"
              />
            ) : (
              <div className="h-28 w-full rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                No image yet
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="Paste image URL or upload"
              />
              <Button type="button" variant="outline" asChild disabled={uploading}>
                <label className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                </label>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ad-link">Link URL (optional)</Label>
            <Input
              id="ad-link"
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="https://…"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <Label htmlFor="ad-order">Order</Label>
              <Input
                id="ad-order"
                type="number"
                className="w-24"
                value={form.order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                id="ad-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="ad-active">Active</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminAdsPage = () => {
  const { data: ads = [], isLoading, isError } = useGetAllAdsQuery();
  const createAd = useCreateAdMutation();
  const updateAd = useUpdateAdMutation();
  const deleteAd = useDeleteAdMutation();

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ads</h1>
            <p className="text-sm text-muted-foreground">
              Manage the banners shown in the app home carousel.
            </p>
          </div>
          <AdFormDialog
            title="New ad"
            submitting={createAd.isPending}
            onSubmit={(data) => createAd.mutateAsync(data)}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Ad
              </Button>
            }
          />
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
              <div className="p-8 text-center text-red-500">Failed to load ads.</div>
            ) : ads.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No ads yet. Create your first banner.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Banner</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-20">Order</TableHead>
                    <TableHead className="w-24">Active</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad._id}>
                      <TableCell>
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="h-10 w-16 rounded object-cover border"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{ad.title}</div>
                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {ad.linkUrl}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{ad.order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={ad.isActive}
                          onCheckedChange={(v) =>
                            updateAd.mutate({ id: ad._id, data: { isActive: v } })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <AdFormDialog
                            title="Edit ad"
                            initial={ad}
                            submitting={updateAd.isPending}
                            onSubmit={(data) =>
                              updateAd.mutateAsync({ id: ad._id, data })
                            }
                            trigger={
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{ad.title}" will be removed from the carousel. This
                                  can't be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteAd.mutate(ad._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

export default AdminAdsPage;
