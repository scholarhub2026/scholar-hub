import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { User, Mail, Phone, MessageSquare } from "lucide-react";

const Details = ({ formData, handleInputChange, setFormData }) => {
  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-slate-900">Your details</h2>
        <p className="mt-1 text-slate-500">Tell us who the session is for.</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="studentName" className="flex items-center gap-1.5 text-sm">
              <User className="h-4 w-4 text-slate-400" /> Student Name
            </Label>
            <Input
              id="studentName"
              name="studentName"
              placeholder="Full name"
              className="h-11"
              value={formData.studentName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-sm">
              <Mail className="h-4 w-4 text-slate-400" /> Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              className="h-11"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm">
            <Phone className="h-4 w-4 text-slate-400" /> Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            placeholder="Your phone number"
            className="h-11"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message" className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="h-4 w-4 text-slate-400" /> Message for mentor
            <span className="font-normal text-slate-400">(optional)</span>
          </Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell the mentor about your goals and the areas you'd like to focus on…"
            className="h-32 resize-none"
            value={formData.message}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Details;
