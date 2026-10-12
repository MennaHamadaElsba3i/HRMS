import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";

const DashboardInner = () => {
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // ==================== Determine Current User Role ====================
  let currentUserRole = "admin";
  if (location.pathname.startsWith("/employee")) {
    currentUserRole = "employee";
  } else if (location.pathname.startsWith("/hr")) {
    currentUserRole = "hr";
  } else if (location.pathname.startsWith("/manager")) {
    currentUserRole = "manager";
  } else if (location.pathname.startsWith("/admin")) {
    currentUserRole = "admin";
  }

  return (
    <NotificationProvider
      currentRole={currentUserRole}
      currentUserId={currentUser?.id || currentUser?.userId}
    >
      <div className="flex min-h-screen w-full bg-[#f5f7f8]">
        <Sidebar
          role={currentUserRole}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div
          className="
            ml-0
            lg:ml-[256px]
            flex min-h-screen min-w-0 flex-1 flex-col
            bg-[#f5f7f8]

            rtl:ml-0
            rtl:mr-0
            rtl:lg:mr-[256px]
          "
        >
          <Header
            role={currentUserRole}
            onToggleMenu={() =>
              setMobileMenuOpen((prev) => !prev)
            }
          />

          <main
            className="
              flex-1
              px-4 sm:px-6 lg:px-[38px]
              py-5 sm:py-6 lg:pt-[34px] lg:pb-[50px]
              w-full max-w-full
            "
          >
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

const DashboardLayout = () => {
  return <DashboardInner />;
};

export default DashboardLayout;
