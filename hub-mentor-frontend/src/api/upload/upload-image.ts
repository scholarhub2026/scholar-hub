import axiosInstance from "@/lib/axios";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // <<< MUST match backend: upload.single("image")

  const response = await axiosInstance.post("/media", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const useUploadMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error) => {
      console.error("Error uploading media:", error);
    },
  });
};
