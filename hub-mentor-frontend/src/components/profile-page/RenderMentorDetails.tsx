import { ProfileFormData } from "@/types/profilePage";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "../ui/label";
import { FileText, GraduationCap, MapPin, MessageSquare } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const RenderMentorDetails = () => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext<ProfileFormData>();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Mentor Details
        </h2>
        <p className="text-gray-600">Tell us about your expertise</p>
      </div>

      {/* About Us with ReactQuill */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <GraduationCap className="inline w-4 h-4 mr-2" />
          About Us
        </Label>
        <Controller
          name="additional_details"
          control={control}
          rules={{ required: "About Us is required" }}
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
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 mr-2" />
          ID Proof
        </Label>
        <Input
          type="number"
          {...register("id_proof", { required: "ID proof is required" })}
          className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.id_proof ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Your ID proof number or document"
        />
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
