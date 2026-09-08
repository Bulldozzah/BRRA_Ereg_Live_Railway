import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { mockAuth } from "@/lib/mockAuth";

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  if (!mockAuth.isAuthenticated()) {
    return <Navigate to="/login-admin" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};
