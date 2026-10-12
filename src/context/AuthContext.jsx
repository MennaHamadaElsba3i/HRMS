/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ROLE_ROUTES } from "../utils/roleRoutes";
import { logoutUser } from "../features/auth/api";
import { disconnectEcho, reconnectEcho } from "../utils/echo";

const AuthContext = createContext(null);

/**
 * Compute initials from a user's full name.
 * e.g., "Noran Baligh" -> "NB", "Menna" -> "ME"
 */
const computeInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

/**
 * Normalize backend user payload to ensure compatibility with
 * existing components expecting userId, initials, etc.
 */
const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  return {
    ...rawUser,
    userId: rawUser.userId ?? rawUser.id,
    initials: rawUser.initials || computeInitials(rawUser.name),
  };
};

/**
 * Restore authentication session from localStorage
 */
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem("token");
    const rawUser =
      localStorage.getItem("user") || localStorage.getItem("currentUser");

    if (!token || !rawUser) {
      return { token: null, user: null, role: null, permissions: [] };
    }

    const parsed = JSON.parse(rawUser);
    const user = normalizeUser(parsed?.user || parsed?.data || parsed);

    if (!user || (!user.email && !user.id && !user.name)) {
      return { token: null, user: null, role: null, permissions: [] };
    }

    const role = user.role || localStorage.getItem("role") || null;
    let permissions = [];
    if (Array.isArray(user.permissions)) {
      permissions = user.permissions;
    } else {
      const rawPerms = localStorage.getItem("permissions");
      if (rawPerms) {
        try {
          permissions = JSON.parse(rawPerms);
        } catch {
          permissions = [];
        }
      }
    }

    return { token, user, role, permissions };
  } catch {
    return { token: null, user: null, role: null, permissions: [] };
  }
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => getStoredAuth());

  const { token, user: currentUser, role, permissions } = authState;
  const isAuthenticated = Boolean(token && currentUser);

  // Sync state if 401 unauthorized event fires from axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      disconnectEcho();
      setAuthState({
        token: null,
        user: null,
        role: null,
        permissions: [],
      });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  /**
   * Log in user and persist session
   */
  const login = useCallback(
    ({ token: newToken, user: newUser }, rememberMe = true) => {
      if (!newToken || !newUser) return;

      const normalized = normalizeUser(newUser);
      const userRole = normalized.role || null;
      const userPermissions = Array.isArray(normalized.permissions)
        ? normalized.permissions
        : [];

      setAuthState({
        token: newToken,
        user: normalized,
        role: userRole,
        permissions: userPermissions,
      });

      try {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(normalized));
        localStorage.setItem("currentUser", JSON.stringify(normalized));
        if (userRole) {
          localStorage.setItem("role", userRole);
        }
        localStorage.setItem("permissions", JSON.stringify(userPermissions));
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }
      } catch (e) {
        console.error("Failed to persist auth data to localStorage", e);
      }

      // Reconnect WebSockets with new session
      reconnectEcho();
    },
    [],
  );

  /**
   * Centralized logout flow
   * Clears state, localStorage, and redirects to appropriate login
   */
  const logout = useCallback(
    async (options = {}) => {
      const previousRole = role;

      // Call backend logout to invalidate the token
      try {
        await logoutUser();
      } catch (e) {
        // Continue with local cleanup even if API call fails
        console.warn("Backend logout failed (token may already be expired)", e);
      }

      // Disconnect WebSockets
      disconnectEcho();

      setAuthState({
        token: null,
        user: null,
        role: null,
        permissions: [],
      });

      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("permissions");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("admin");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("rememberMe");
      } catch (e) {
        console.error("Failed to clear auth data from localStorage", e);
      }

      const defaultRedirect =
        previousRole === "Owner" ? "/owner/login" : "/login";
      const targetUrl = options?.redirectTo || defaultRedirect;

      if (options?.navigate) {
        options.navigate(targetUrl, { replace: true });
      } else if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      }
    },
    [role],
  );

  const clearAuthSession = useCallback(() => {
    disconnectEcho();

    setAuthState({
      token: null,
      user: null,
      role: null,
      permissions: [],
    });

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("permissions");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("admin");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("rememberMe");
    } catch (e) {
      console.error("Failed to clear auth session", e);
    }
  }, []);
  /**
   * Permission helper
   */
  const hasPermission = useCallback(
    (permissionName) => {
      if (!permissionName || !Array.isArray(permissions)) return false;
      return permissions.includes(permissionName);
    },
    [permissions],
  );

  /**
   * Update current user in state & storage (used by profile updates)
   */
  const setCurrentUser = useCallback(
    (updatedUser) => {
      if (!updatedUser) {
        logout();
        return;
      }
      const normalized = normalizeUser(updatedUser);
      const updatedRole = normalized.role || role;
      const updatedPermissions = Array.isArray(normalized.permissions)
        ? normalized.permissions
        : permissions;

      setAuthState((prev) => ({
        ...prev,
        user: normalized,
        role: updatedRole,
        permissions: updatedPermissions,
      }));

      try {
        localStorage.setItem("user", JSON.stringify(normalized));
        localStorage.setItem("currentUser", JSON.stringify(normalized));
        if (updatedRole) {
          localStorage.setItem("role", updatedRole);
        }
        localStorage.setItem("permissions", JSON.stringify(updatedPermissions));
      } catch (e) {
        console.error("Failed to update user in localStorage", e);
      }
    },
    [logout, permissions, role],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        role,
        permissions,
        isAuthenticated,
        login,
        logout,
        clearAuthSession,
        hasPermission,
        setCurrentUser,
        ROLE_ROUTES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
