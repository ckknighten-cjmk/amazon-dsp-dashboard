import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { canAccess, defaultPathFor } from "../lib/rbac";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to={defaultPathFor(user.role)} replace />;
  }

  return <>{children}</>;
}
