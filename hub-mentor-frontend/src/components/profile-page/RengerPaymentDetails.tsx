import { ProfileFormData } from "@/types/profilePage";
import {
  Camera,
  CreditCard,
  MessageSquare,
  Trash,
  Trash2,
  Upload,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import axiosInstance from "@/lib/axios";
import { useUploadMediaMutation } from "@/api/upload/upload-image";

const getInputClass = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

const RenderPaymentDetails = () => {
  const {
    register,
    watch,
    reset,
    formState: { errors },
  } = useFormContext<ProfileFormData>();

  const paymentErrors = errors.payment_details || {};

  const { mutate: uploadMedia } = useUploadMediaMutation();

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMedia(file, {
      onSuccess: (data) => {
        reset({
          ...watch(),
          profile_pic: data.url,
          profilePicPreview: data.url,
        });
      },
    });
  
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="inline w-4 h-4 mr-2" />
            Bank Account
          </Label>
          <Input
            type="text"
            {...register("payment_details.back_account", {
              required: "Bank account is required",
            })}
            value={watch("payment_details.back_account")}
            className={getInputClass(!!paymentErrors.back_account)}
            placeholder="Account number"
            error={paymentErrors.back_account?.message}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            IFSC Code
          </Label>
          <Input
            type="text"
            {...register("payment_details.ifsc_code", {
              required: "IFSC code is required",
            })}
            value={watch("payment_details.ifsc_code")}
            className={getInputClass(!!paymentErrors.ifsc_code)}
            placeholder="IFSC code"
            error={paymentErrors.ifsc_code?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </Label>
          <Input
            type="text"
            {...register("payment_details.branch", {
              required: "Branch name is required",
            })}
            value={watch("payment_details.branch")}
            className={getInputClass(!!paymentErrors.branch)}
            placeholder="Branch name"
            error={paymentErrors.branch?.message}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name
          </Label>
          <Input
            type="text"
            {...register("payment_details.account_holder_name", {
              required: "Account holder name is required",
            })}
            value={watch("payment_details.account_holder_name")}
            className={getInputClass(!!paymentErrors.account_holder_name)}
            placeholder="Account holder name"
            error={paymentErrors.account_holder_name?.message}
          />
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          UPI ID
        </Label>
        <Input
          type="text"
          {...register("payment_details.upi_id", {
            required: "UPI ID is required",
          })}
          value={watch("payment_details.upi_id")}
          className={getInputClass(!!paymentErrors.upi_id)}
          placeholder="your-upi@provider"
          error={paymentErrors.upi_id?.message}
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <Camera className="inline w-4 h-4 mr-2" />
          Profile Picture
        </Label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
            
              className="hidden"
              id="profile-pic-upload"
            />
            <Label
              htmlFor="profile-pic-upload"
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              {watch("profile_pic") ? "Change Image" : "Upload Profile Picture"}
            </Label>
          </div>
          {watch("profilePicPreview") && (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 group">
              <img
                src={watch("profilePicPreview")}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />

              <Trash2 className="absolute cursor-pointer top-0 right-0 bg-black bg-opacity-50 text-red-700 rounded-full p-1 hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100" />
            </div>
          )}
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline w-4 h-4 mr-2" />
          Additional note <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <Textarea
          {...register("message")}
          value={watch("message")}
          rows={3}
          className={getInputClass(!!errors.message)}
          placeholder="Anything else you'd like the admin to know (optional)"
          error={errors.message?.message}
        />
      </div>
    </div>
  );
};

export default RenderPaymentDetails;
