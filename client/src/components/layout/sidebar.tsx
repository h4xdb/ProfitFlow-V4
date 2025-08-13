import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "fas fa-chart-line",
    roles: ["admin", "manager", "cash_collector"],
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: "fas fa-tasks",
    roles: ["admin", "manager"],
  },
  {
    name: "Receipt Books",
    href: "/receipt-books",
    icon: "fas fa-book",
    roles: ["admin", "manager", "cash_collector"],
  },
  {
    name: "Receipts",
    href: "/receipts",
    icon: "fas fa-receipt",
    roles: ["admin", "manager", "cash_collector"],
  },
  {
    name: "Expenses",
    href: "/expenses",
    icon: "fas fa-credit-card",
    roles: ["admin", "manager"],
  },
  {
    name: "Financial Reports",
    href: "/reports",
    icon: "fas fa-chart-pie",
    roles: ["admin", "manager"],
  },
  {
    name: "User Management",
    href: "/users",
    icon: "fas fa-users",
    roles: ["admin"],
  },
  {
    name: "Data Backup",
    href: "/backup",
    icon: "fas fa-download",
    roles: ["admin", "manager"],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <>
      <div className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 bg-white shadow-lg flex-shrink-0 flex flex-col h-screen
        fixed lg:relative top-0 left-0 z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-islamic-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-mosque text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Masjid ERP</h1>
            <p className="text-xs text-gray-500">Financial Management</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
            <p className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded-full inline-block capitalize">
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item, index) => {
          const isActive = location === item.href;
          const isAfterManagement = item.roles.includes("admin") && item.name === "User Management";
          
          return (
            <div key={item.name}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.name}</span>
                </a>
              </Link>
              
              {/* Show logout after User Management for admin/manager */}
              {isAfterManagement && (user.role === "admin" || user.role === "manager") && (
                <div className="mt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Public Reports Link */}
        <a
          href="/public-reports"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <i className="fas fa-globe w-5"></i>
          <span>Public Reports</span>
          <i className="fas fa-external-link-alt text-xs ml-auto"></i>
        </a>
        
        {/* Logout for cash collectors (at bottom) */}
        {user.role === "cash_collector" && (
          <div className="mt-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </nav>
    </div>
    </>
  );
}
