import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: string[];
  children?: ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {

  console.log("mounted the role guard");
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <Lock className="mx-auto h-10 w-10 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}