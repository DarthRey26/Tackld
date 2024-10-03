import { HomeIcon, UserIcon } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    title: "Account",
    to: "/account",
    icon: <UserIcon className="h-4 w-4" />,
  },
];