import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  Wallet,
  Star,
  Gift,
  Heart,
  Clock,
  ThumbsUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    id: 1,
    name: "Air Conditioning Repair",
    icon: Wrench,
    description: "Fix or maintain your AC unit",
    category: "Home Maintenance",
    rating: 4.5,
  },
  {
    id: 2,
    name: "Plumbing Services",
    icon: Droplet,
    description: "Resolve any plumbing issues",
    category: "Home Maintenance",
    rating: 4.2,
  },
  {
    id: 3,
    name: "Car Wash",
    icon: Car,
    description: "Get your car cleaned and shining",
    category: "Automotive",
    rating: 4.7,
  },
  {
    id: 4,
    name: "House Cleaning",
    icon: Home,
    description: "Professional house cleaning services",
    category: "Cleaning",
    rating: 4.8,
  },
  {
    id: 5,
    name: "Electrical Services",
    icon: Zap,
    description: "Electrical repairs and installations",
    category: "Home Maintenance",
    rating: 4.3,
  },
  {
    id: 6,
    name: "Waste Removal",
    icon: Trash,
    description: "Efficient waste removal and disposal",
    category: "Home Maintenance",
    rating: 4.1,
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
        {isLoading ? (
          <p className="text-sm mt-2">Loading available providers...</p>
        ) : (
          <div className="mt-2">
            <p className="text-sm font-semibold">
              {availableProviders} providers available
            </p>
            <div className="flex items-center mt-1">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="text-sm">{service.rating.toFixed(1)}</span>
            </div>
          </div>
        )}
        <div className="mt-2 flex items-center text-green-600">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-xs font-semibold">Available Now</span>
        </div>
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
      <Heart className="h-5 w-5 text-red-500 mr-2" />
      <span>Favorite Services</span>
    </Button>
  </div>
);

const RecommendedServices = () => (
  <div className="bg-blue-50 p-4 rounded-lg mt-4">
    <h3 className="text-lg font-semibold mb-2 flex items-center">
      <ThumbsUp className="h-5 w-5 text-blue-500 mr-2" />
      Recommended Services
    </h3>
    <ul className="space-y-2">
      {services.slice(0, 3).map((service) => (
        <li key={service.id} className="flex items-center">
          <service.icon className="h-4 w-4 text-[#283579] mr-2" />
          <span className="text-sm">{service.name}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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
            <RecommendedServices />
          </div>
          <div className="w-full md:w-3/4">
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-blue-300 focus:border-blue-500 rounded-full w-full"
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
