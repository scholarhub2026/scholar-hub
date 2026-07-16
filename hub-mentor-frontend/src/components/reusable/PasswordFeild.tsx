import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PasswordField({ register, errors, fieldname, watch, isLogin = false }) {
  const [showPassword, setShowPassword] = useState(false)

  const passwordValue = watch("password") // get original password

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldname}>
        {fieldname === "confirmPassword" ? "Confirm Password" : "Password"}
      </Label>

      <div className="relative">
        <Input
          id={fieldname}
          placeholder={
            fieldname === "confirmPassword"
              ? "Confirm your password"
              : isLogin
                ? "Enter your password"
                : "Create a password"
          }
          type={showPassword ? "text" : "password"}
          {...register(fieldname, {
            required:
              fieldname === "confirmPassword"
                ? "Please confirm your password"
                : "Password is required",

            // Complexity rules apply only when CREATING a password (signup).
            // On login we must not block an existing password that predates
            // these rules — the server verifies the credentials.
            ...(fieldname !== "confirmPassword" && !isLogin && {
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
              validate: {
                hasUppercase: (value) =>
                  /[A-Z]/.test(value) ||
                  "Password must contain an uppercase letter",
                hasLowercase: (value) =>
                  /[a-z]/.test(value) ||
                  "Password must contain a lowercase letter",
                hasNumber: (value) =>
                  /\d/.test(value) || "Password must contain a number",
              },
            }),

            ...(fieldname === "confirmPassword" && {
              validate: (value) =>
                value === passwordValue || "Passwords do not match",
            }),
          })}
          className="pr-10"
          error={errors?.[fieldname]?.message}
        />

        {/* Eye Icon Button */}
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

     
    </div>
  )
}
