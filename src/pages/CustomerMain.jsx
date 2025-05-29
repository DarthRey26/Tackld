import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import routes from "@/routes/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  Droplet,
  Car,
  Home,
  Search,
  Zap,
  Trash,
  Paintbrush,
  Wallet,
  Star,
  Gift,
  Heart,
  Clock,
  ThumbsUp,
  ActivityIcon,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedDots from "@/components/ui/animated-dots";
import "../index.css";

const services = [
  {
    id: 1,
    name: "Air Conditioning",
    icon: Wrench,
    description: "Fix or maintain your AC unit",
    category: "Property Maintenance",
  },
  {
    id: 2,
    name: "Plumbing Services",
    icon: Droplet,
    description: "Resolve any plumbing issues",
    category: "Property Maintenance",
  },
  {
    id: 3,
    name: "House Cleaning",
    icon: Home,
    description: "Professional house cleaning services",
    category: "Cleaning",
  },
  {
    id: 4,
    name: "Electrical Services",
    icon: Zap,
    description: "Electrical repairs and installations",
    category: "Property Maintenance",
  },
  {
    id: 5,
    name: "Painting",
    icon: Paintbrush,
    description: "Interior painting services",
    category: "Property Maintenance",
  },
];

const fetchAvailableProviders = async (serviceId) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return Math.floor(Math.random() * 10) + 1;
};

const ServiceCard = ({ service }) => {
  const { data: availableProviders, isLoading } = useQuery({
    queryKey: ["providers", service.id],
    queryFn: () => fetchAvailableProviders(service.id),
  });

  const IconComponent = service.icon;

  return (
    <Card className="w-full h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <IconComponent className="h-8 w-8 text-[#283579]" />
          {service.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <CardDescription className="text-sm">
          {service.description}
        </CardDescription>
        <p className="text-sm mt-2 font-semibold text-[#283579]">
          {service.category}
        </p>
        <div className="mt-2 flex items-center text-green-600">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-xs font-semibold">Available Now</span>
        </div>
        {isLoading ? (
          <p className="text-sm mt-2">Loading available providers...</p>
        ) : (
          <div className="mt-2 mb-2">
            <p className="text-sm font-semibold">
              {availableProviders}{" "}
              {availableProviders === 1 ? "provider" : "providers"} available
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Link to={`/request/${service.id}`} className="flex-grow">
          <Button className="w-full bg-[#283579] hover:bg-[#283579]">
            Book Service
          </Button>
        </Link>
        <Button variant="ghost" size="icon">
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const Sidebar = () => (
  <div className="bg-gray-100 p-4 rounded-lg space-y-4">
    <Button variant="ghost" className="w-full justify-start hover:bg-blue-100">
      <Wallet className="h-5 w-5 text-blue-500 mr-2" />
      <span className="font-semibold">Wallet: $100</span>
    </Button>
    <Button
      variant="ghost"
      className="w-full justify-start hover:bg-yellow-100"
    >
      <Star className="h-5 w-5 text-yellow-500 mr-2" />
      <span>Leave a Review</span>
    </Button>
    <Button variant="ghost" className="w-full justify-start hover:bg-green-100">
      <Gift className="h-5 w-5 text-green-500 mr-2" />
      <span>Redeem Vouchers</span>
    </Button>
    <Button variant="ghost" className="w-full justify-start hover:bg-red-100">
      <History className="h-5 w-5 text-red-500 mr-2" />
      <span>Activity</span>
    </Button>
  </div>
);

const CurrentJobSummary = () => {
  const navigate = useNavigate();
  const [currentJob, setCurrentJob] = useState(null);

  useEffect(() => {
    const storedJob = sessionStorage.getItem("currentJob");
    if (storedJob) {
      setCurrentJob(JSON.parse(storedJob));
    }
  }, []);

  if (!currentJob) return null;

  return (
    <div
      className="bg-white p-4 rounded-lg border border-gray-200 shadow hover:shadow-md transition cursor-pointer"
      onClick={() => navigate(routes.jobDetail)}
    >
      <h3 className="text-lg font-semibold mb-2 text-[#283579] flex items-center">
        <ActivityIcon className="h-5 w-5 mr-2" />
        Current Job Summary
      </h3>
      <div className="text-sm space-y-1">
        <p>
          <span className="font-medium">Service:</span> {currentJob.serviceName}
        </p>
        <p>
          <span className="font-medium">Category:</span> {currentJob.category}
        </p>
        <p className="line-clamp-2">
          <span className="font-medium">Description:</span>{" "}
          {currentJob.description}
        </p>
        {currentJob.image && (
          <img
            src={currentJob.image}
            alt="Job"
            className="mt-2 rounded-md max-h-40 w-full object-cover"
          />
        )}
      </div>
      <div className="text-right mt-3">
        <span className="text-blue-600 font-medium">View Details →</span>
      </div>
    </div>
  );
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isJobInProgress, setIsJobInProgress] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkJobStatus = () => {
      const inProgress = sessionStorage.getItem("isJobInProgress");
      setIsJobInProgress(inProgress === "true");
    };

    checkJobStatus(); // Run on mount

    const handleStorageChange = () => {
      checkJobStatus(); // Re-check on sessionStorage change
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "" ||
        categoryFilter === "all" ||
        service.category === categoryFilter)
  );

  const categories = [
    "All Categories",
    ...new Set(services.map((service) => service.category)),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#283579]">
          Welcome to Tackld
        </h1>
        <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
          <div className="w-full md:w-1/4 space-y-4">
            <Sidebar />
            <CurrentJobSummary />
          </div>
          <div className="w-full md:w-3/4">
            {isJobInProgress && (
              <div
                onClick={() => {
                  console.log("Card clicked");
                  navigate(routes.jobDetail);
                }}
                className="bg-green-500 text-white font-bold rounded-lg px-6 py-7 flex items-center justify-between mb-6 cursor-pointer hover:bg-green-600 transition"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  <span className="text-lg">
                    Waiting for contractors
                    <AnimatedDots />
                  </span>
                </div>
                <span className="text-white font-semibold">View</span>
              </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full w-full focus:outline-none focus:ring-0"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <Select onValueChange={setCategoryFilter} value={categoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category === "All Categories" ? "all" : category}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
