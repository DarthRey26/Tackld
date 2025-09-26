import React from "react";
import { Link } from "react-router-dom";
import { UserIcon, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "../assets/images/tackld-logo-final.png";

const Header = () => {
  const { user, userProfile, userType, loading, signOut } = useAuth();
  
  if (loading) {
    return (
      <header className="bg-white sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Tackld Logo" className="h-[64px]" />
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white sticky top-0 z-10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img src={logo} alt="Tackld Logo" className="h-[64px]" />
          </Link>
          <div className="flex items-center space-x-4">
            {user && (
              <Link
                to={userType === "customer" ? "/customer-dashboard" : "/contractor-main"}
                className="flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                <span className="mt-1">Dashboard</span>
              </Link>
            )}

            {/* Conditionally render "Login" or "Account" link based on login status */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/account"
                  className="flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="mt-1">Account</span>
                </Link>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="mt-1">Logout</span>
                </Button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="mt-1">Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
