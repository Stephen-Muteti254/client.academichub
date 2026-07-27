import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAuthProps {
  requiredRole?: string[];
}

export const RequireAuth = ({ requiredRole }: RequireAuthProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const ROLE_HIERARCHY = {
    super_admin: ["super_admin", "admin"],
    admin: ["admin"],
    writer: ["writer"],
    client: ["client"],
  };

  // 1. Wait for auth to load FIRST
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Then check auth existence
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. THEN safely use user.role
  if (requiredRole) {
    const userRoles = ROLE_HIERARCHY[user.role] || [user.role];
    const hasAccess = requiredRole.some(role => userRoles.includes(role));

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};