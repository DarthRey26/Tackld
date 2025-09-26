import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AirVent, Wrench, Zap, Sparkles, Paintbrush } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "../location.css";
import AboutAndFAQ from "../components/AboutAndFAQ";
import tackldBanner from "../assets/images/tackld-banner-final3.png";
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const services = [{
    id: "aircon",
    name: "Aircon",
    icon: AirVent,
    description: "Installation, repair & maintenance",
    color: "bg-blue-500"
  }, {
    id: "plumbing",
    name: "Plumbing",
    icon: Wrench,
    description: "Pipes, toilets, sinks & water heaters",
    color: "bg-green-500"
  }, {
    id: "electrical",
    name: "Electrical",
    icon: Zap,
    description: "Wiring, outlets, switches & repairs",
    color: "bg-yellow-500"
  }, {
    id: "cleaning",
    name: "Cleaning",
    icon: Sparkles,
    description: "Home, office & post-renovation cleaning",
    color: "bg-purple-500"
  }, {
    id: "painting",
    name: "Painting",
    icon: Paintbrush,
    description: "Interior & exterior painting services",
    color: "bg-orange-500"
  }];
  
  const handleServiceClick = serviceId => {
    if (user) {
      navigate(`/book/${serviceId}`);
    } else {
      navigate("/login");
    }
  };
  const SliderSection = () => {
    return <div className="w-full p-0 relative">
        <img src={tackldBanner} alt="Tackld Banner" className="w-full h-[600px] object-cover" />
        
      </div>;
  };
  const ServicesSection = () => {
    return <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600">
              Choose from our 5 core home services - all verified contractors, instant booking
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {services.map(service => {
            const Icon = service.icon;
            return <Card key={service.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => handleServiceClick(service.id)}>
                  <CardHeader className="text-center pb-4">
                    <div className={`${service.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <p className="text-gray-600 text-sm mb-4">
                      {service.description}
                    </p>
                    <Button className="w-full bg-[#283579] hover:bg-blue-700 text-white">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </div>;
  };
  const Info = () => {
    return <AboutAndFAQ />;
  };
  const Footer = () => {
    return <footer className="bg-[#192252] text-white py-10">
        <div className="container mx-auto text-center">
          <p className="text-lg mb-4">© 2025 Tackld. All Rights Reserved.</p>
          <div>
            <a href="#" className="text-white hover:text-gray-400 mx-4">
              Privacy Policy
            </a>
            <a href="#" className="text-white hover:text-gray-400 mx-4">
              Terms of Service
            </a>
            <a href="#" className="text-white hover:text-gray-400 mx-4">
              Contact Us
            </a>
          </div>
        </div>
      </footer>;
  };
  return <div className="overflow-x-hidden">
      {SliderSection()}
      {ServicesSection()}
      {Info()}
      {Footer()}
    </div>;
};
export default Index;