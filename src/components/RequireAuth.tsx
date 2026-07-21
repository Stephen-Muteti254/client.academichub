import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PORTALS } from "@/config/portals";
import PageLoader from "@/components/PageLoader";
import ExternalRedirect from "@/components/ExternalRedirect";

interface RequireAuthProps {
  requiredRole?: string[];
}

export const RequireAuth = ({ requiredRole }: RequireAuthProps) => {
  const { user, accessToken, isLoading } = useAuth();
  const location = useLocation();

  const ROLE_HIERARCHY = {
    super_admin: ["super_admin", "admin"],
    admin: ["admin"],
    writer: ["writer"],
    client: ["client"],
  };

  // 1. Wait for auth to load FIRST
  if (isLoading) {
    return <PageLoader />;
  }

  // 2. Then check auth existence
  if (!accessToken || !user) {
    return (
        <ExternalRedirect
            to={PORTALS.AUTH}
        />
    );
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