import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { navItems } from "../nav-items";
import { UserIcon } from "lucide-react";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check sessionStorage when component mounts
    const checkLoginStatus = () => {
      const loggedIn = sessionStorage.getItem("isLoggedIn");
      setIsLoggedIn(!!loggedIn);
    };

    checkLoginStatus(); // Check on component mount

    // Listen for storage changes (including manual trigger)
    const handleStorageChange = () => {
      checkLoginStatus(); // Update login status when storage changes
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <header className="bg-white sticky top-0 z-10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-blue-600">Tackld</span>
          </Link>
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {item.icon}
                <span className="mt-1">{item.title}</span>
              </Link>
            ))}
            {/* Conditionally render "Login" or "Account" link based on login status */}
            {isLoggedIn ? (
              <Link
                to="/account"
                className="flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="mt-1">Account</span>
              </Link>
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
