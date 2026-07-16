import React from "react";
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
import { TLoginFormValues } from "@/types/loginPage";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "@/api/auth/login";
import PasswordField from "../reusable/PasswordFeild";

const LoginCard = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TLoginFormValues>();
  const {mutate}=useLoginMutation();
  const onSubmit = (data: TLoginFormValues) => {
    mutate(data)
    
  };
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-lg shadow-slate-900/5">
      <CardHeader className="text-start">
        <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Scholar Hub account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
              error={errors.email?.message}
            />
          </div>
          <div className="space-y-2">
            <div className="flex ">
              {/* <Label htmlFor="password">Password</Label> */}
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                {/* Forgot password? */}
              </Link>
            </div>
            <PasswordField register={register} fieldname="password" errors={errors} watch={watch} isLogin/>
          </div>
          {/* <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="remember" className="text-sm">
              Remember me for 30 days
            </Label>
          </div> */}
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="h-11 w-full text-base shadow-md shadow-primary/20">
            Sign In
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginCard;
