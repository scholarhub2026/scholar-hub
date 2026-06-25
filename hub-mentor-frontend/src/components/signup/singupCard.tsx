import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { TSignupFormValues } from "@/types/loginPage";
import { useSignupMutation } from "@/api/auth/signin";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import PasswordField from "../reusable/PasswordFeild";
const SignUpCard = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TSignupFormValues>();
  const { mutate } = useSignupMutation();
  const onSubmit = (data: TSignupFormValues) => {
    mutate(data);
  };
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Join Scholar Hub and start your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-start">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="First Name"
                error={errors?.firstName?.message}
                {...register("firstName", {
                  required: "First Name is required",
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last Name"
                {...register("lastName", { required: "Lastname is required" })}
                error={errors?.lastName?.message}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Invalid email address",
                },
              })}
              error={errors?.email?.message}
            />
          </div>
          <div className="space-y-2">
              <Label htmlFor="lastName">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="Phone Number"
                {...register("phoneNumber", { required: "Phone number is required" })}
                error={errors?.phoneNumber?.message}
              />
            </div>

            <PasswordField register={register} fieldname="password" errors={errors} watch={watch}/>
            <PasswordField register={register} fieldname="confirmPassword" errors={errors}  watch={watch}/>
      
       
          <div className="flex items-center space-x-2">
            <input
              {...register("terms", { required: "You must accept the terms" })}
              type="checkbox"
              id="terms"
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="terms" className="text-xs">
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                terms and conditions
              </a>
            </Label>
            {errors?.terms && (
              <p className="text-xs text-red-500">{errors.terms.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full">Create Account</Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignUpCard;
