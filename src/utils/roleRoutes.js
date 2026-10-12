/**
 * Centralized role-to-route mapping and navigation helpers
 * Source of truth for all role-based dashboard destinations
 */

export const ROLE_ROUTES = {
  Owner: "/admin/dashboard",
  HR: "/hr/dashboard",
  Manager: "/manager/dashboard",
  Employee: "/employee/dashboard",
};

export const getDashboardForRole = (role) => {
  return ROLE_ROUTES[role] || "/login";
};

export const getLoginRouteForRole = (role) => {
  return role === "Owner" ? "/owner/login" : "/login";
};
