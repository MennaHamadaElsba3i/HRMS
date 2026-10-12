import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_ROUTES } from "../utils/roleRoutes";

/**
 * ProtectedRoute
 * Guards routes by checking authentication status and verifying backend user role.
 *
 * @param {Array<string>} [allowedRoles] - Backend roles permitted (e.g. ['Owner'], ['HR'], ['Manager'], ['Employee'])
 * @param {React.ReactNode} [children] - Optional children, renders Outlet if not provided
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated: Redirect to role-appropriate login route
  if (!isAuthenticated) {
    const isOwnerRoute =
      location.pathname.startsWith("/admin") ||
      Boolean(allowedRoles && allowedRoles.includes("Owner"));

    const loginPath = isOwnerRoute ? "/owner/login" : "/login";

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. Authenticated but unauthorized role: Redirect to user's assigned dashboard
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const userDashboard = ROLE_ROUTES[role] || "/login";
    return <Navigate to={userDashboard} replace />;
  }

  // 3. Authorized
  return children ? children : <Outlet />;
}

/**
 * PublicRoute
 * Prevents authenticated users from accessing guest-only auth pages (like /login).
 * Redirects them directly to their role-based dashboard.
 */
export function PublicRoute({
  children,
  allowAuthenticated = false,
}) {
  const { isAuthenticated, role } = useAuth();

  if (
    !allowAuthenticated &&
    isAuthenticated &&
    role &&
    ROLE_ROUTES[role]
  ) {
    return <Navigate to={ROLE_ROUTES[role]} replace />;
  }

  return children ? children : <Outlet />;
}