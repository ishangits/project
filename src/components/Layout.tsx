import React, { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Bot,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Domains", href: "/domains", icon: Users },
    { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
    { name: "Token Usage", href: "/token-usage", icon: BarChart3 },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-70 bg-gray-50 shadow-md
 transform ${
   sidebarOpen ? "translate-x-0" : "-translate-x-full"
 } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600">
          <div className="flex items-center">
            {/* <Settings className="h-8 w-8 text-white" /> */}
<Bot className="h-7 w-7 text-white" />
            <span className="ml-2 text-lg font-normal text-gray-50 font-sans">
              ChatBot Admin Panel
            </span>
          </div>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-8 px-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600 border-r-2 border-blue-400"
                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon
                  className={`h-5 w-5 mr-3 ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                {/* Change Password Link */}
      <Link
        to="/change-password"
        className="text-blue-600 hover:text-blue-800 text-xs mt-1 block"
      >
        Change Password
      </Link>
            </div>
           <button
  // onClick={handleLogout}
  className="ml-3 p-2 text-gray-500 hover:text-gray-600 rounded-lg transition-colors"
  title="Logout"
>
  <LogOut className="h-4 w-4" />
</button>

          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-gray-50 shadow border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:hidden"></div>

            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline-block text-sm text-gray-600">
                Welcome back, {admin?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
