import { ProfileFormData } from "@/types/profilePage";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "../ui/label";
import { FileText, GraduationCap, Loader2, MapPin, Upload } from "lucide-react";
import { Input } from "../ui/input";
import { useUploadMediaMutation } from "@/api/upload/upload-image";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const RenderMentorDetails = () => {
  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProfileFormData>();

  const { mutate: uploadMedia, isPending: uploadingId } = useUploadMediaMutation();
  const idProof = watch("id_proof");

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMedia(file, {
      onSuccess: (data: { url: string }) =>
        setValue("id_proof", data.url, { shouldValidate: true }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Mentor Details
        </h2>
        <p className="text-gray-600">Tell us about your expertise</p>
      </div>

      {/* About You (mentor bio) */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          <GraduationCap className="inline w-4 h-4 mr-2" />
          About You
        </Label>
        <p className="text-xs text-gray-500 mb-2">
          A short bio shown to students — your experience, teaching style, and what you specialize in.
        </p>
        <Controller
          name="additional_details"
          control={control}
          rules={{ required: "Please tell students a bit about yourself" }}
          render={({ field }) => (
            <ReactQuill
              theme="snow"
              value={field.value || ""}
              onChange={field.onChange}
              style={{ height: '200px', paddingBottom: '40px' }}
            />
          )}
        />
        {errors.additional_details && (
          <p className="text-red-500 text-sm mt-1">{errors.additional_details.message}</p>
        )}
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <GraduationCap className="inline w-4 h-4 mr-2" />
          Education Qualification
        </Label>
        <select
          {...register("education_qualification", {
            required: "Education qualification is required",
          })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.education_qualification
              ? "border-red-500"
              : "border-gray-300"
          }`}
        >
          <option value="">Select your qualification</option>
          <option value="High School">High School</option>
          <option value="Bachelor's Degree">Bachelor's Degree</option>
          <option value="Master's Degree">Master's Degree</option>
          <option value="PhD">PhD</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
          <option value="Other">Other</option>
        </select>
        {errors.education_qualification && (
          <p className="text-red-500 text-sm mt-1">
            {errors.education_qualification.message}
          </p>
        )}
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-2" />
          Location
        </Label>
        <Input
          type="text"
          {...register("location", { required: "Location is required" })}
          className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.location ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Your location"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          <FileText className="inline w-4 h-4 mr-2" />
          ID Proof
        </Label>
        <p className="text-xs text-gray-500 mb-2">
          Upload a government ID (image or PDF) for verification.
        </p>

        {/* Holds the uploaded document URL for validation */}
        <input type="hidden" {...register("id_proof", { required: "ID proof is required" })} />
        <input
          type="file"
          accept="image/*,.pdf"
          id="id-proof-upload"
          className="hidden"
          onChange={handleIdUpload}
        />
        <Label
          htmlFor="id-proof-upload"
          className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            errors.id_proof ? "border-red-400" : "border-gray-300 hover:border-blue-500"
          } text-gray-600 hover:text-blue-600`}
        >
          {uploadingId ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 mr-2" />
          )}
          {idProof ? "Change document" : "Upload ID proof"}
        </Label>

        {idProof && (
          <a
            href={idProof}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            View uploaded document
          </a>
        )}
        {errors.id_proof && (
          <p className="text-red-500 text-sm mt-1">{errors.id_proof.message}</p>
        )}
      </div>

      {/* <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline w-4 h-4 mr-2" />
          Additional Details
        </Label>
        <Textarea
          {...register("additional_details")}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional information about your teaching experience, specializations, etc."
        />
      </div> */}
    </div>
  );
};

export default RenderMentorDetails;
