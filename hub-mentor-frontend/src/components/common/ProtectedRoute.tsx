// src/components/common/ProtectedRoute.tsx
import { useVerifyTokenQuery } from "@/api/auth/refreshToken";
import { store } from "@/contexts/store";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  
 
 const {data,isSuccess}=useVerifyTokenQuery(!!token);


    // If token is not present or verification fails, redirect to login
    if(isSuccess){
        store.loggedUser = {
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
            role: data.user.role,
            completedProfile: data.user.completedProfile,
            is_first_login: data.user.is_first_login,
            
        };
      }

  if (!token ) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
