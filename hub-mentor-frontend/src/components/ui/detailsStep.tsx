import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DetailsStepProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleRadioChange: (name: string, value: string) => void;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  formData,
  handleInputChange,
  handleRadioChange,
}) => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Enter Session Details</h2>
        <p className="text-muted-foreground">
          Provide information about the student and session.
        </p>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Student Name</Label>
          <Input
            id="studentName"
            name="studentName"
            placeholder="Full Name"
            value={formData.studentName}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          name="phone"
          placeholder="Your phone number"
          value={formData.phone}
          onChange={handleInputChange}
        />
      </div>

      {/* Session Type */}
      <div className="space-y-2">
        <Label>Session Type</Label>
        <RadioGroup
          value={formData.sessionType}
          onValueChange={(val) => handleRadioChange("sessionType", val)}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="one-time" id="one-time" />
              <Label htmlFor="one-time">One-time Session</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring">Weekly Recurring Sessions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="package" id="package" />
              <Label htmlFor="package">5-Session Package (15% off)</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Optional Message */}
      <div className="space-y-2">
        <Label htmlFor="message">Message for Mentor (Optional)</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell the mentor about your goals and specific areas you'd like to focus on..."
          className="h-32"
          value={formData.message}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};

export default DetailsStep;
