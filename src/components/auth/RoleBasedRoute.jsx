import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function RoleBasedRoute({
  allowedRoles = [],
  children,
}) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}