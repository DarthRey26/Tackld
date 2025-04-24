import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import "../location.css";
import AboutAndFAQ from "../components/AboutAndFAQ";
import tackldBanner from "../assets/images/tackld-banner-final3.png";

const Index = () => {
  const [locations, setLocations] = useState([
    {
      name: "ION Orchard",
      service: "Air conditioning repair",
      date: "12 November 2024",
      phone: "123-456-7890",
      address: "#B4-06",
      hours: "5 minutes ago",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
      id: 1,
    },
    {
      name: "Plaza Singapura",
      service: "Plumbing",
      date: "12 November 2024",
      phone: "123-456-7890",
      address: "#B1-07",
      hours: "12 minutes ago",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.162152516255!2d103.8452356!3d1.3005317!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x73f8899801be03cf!2sPlaza%20Singapura!5e0!3m2!1sen!2ssg!4v1670051991669!5m2!1sen!2ssg",
      id: 2,
    },
    {
      name: "200 Hougang Ave",
      service: "Plumbing",
      date: "12 November 2024",
      phone: "123-456-7890",
      address: "#13-06",
      hours: "13 minutes ago",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
      id: 3,
    },
    {
      name: "OCBC Centre",
      service: "Electrical",
      date: "12 November 2024",
      phone: "123-456-7890",
      address: "Level 7",
      hours: "16 minutes ago",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.162152516255!2d103.8452356!3d1.3005317!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x73f8899801be03cf!2sPlaza%20Singapura!5e0!3m2!1sen!2ssg!4v1670051991669!5m2!1sen!2ssg",
      id: 4,
    },
    {
      name: "Bugis Junction",
      service: "Air conditioning repair",
      date: "12 November 2024",
      phone: "123-456-7890",
      address: "#01-06",
      hours: "20 minutes ago",
      mapSrc:
        "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
      id: 5,
    },
  ]);

  const SliderSection = () => {
    return (
      <div className="w-full p-0">
        {/* <div className="text-3xl font-bold mb-6">Open requests</div> */}

        <Carousel className="w-full mx-0">
          <CarouselPrevious />
          <CarouselContent className="w-full flex !pl-0 !ml-0">
            {locations.map((location) => (
              <CarouselItem
                key={location.id}
                className="flex-shrink-0 basis-full !pl-0 !ml-0"
              >
                <img
                  src={tackldBanner}
                  alt="Logo"
                  className="w-full h-[600px] object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      </div>
    );
  };

  const Info = () => {
    return <AboutAndFAQ />;
  };

  const Footer = () => {
    return (
      <footer className="bg-[#192252] text-white py-10">
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
      </footer>
    );
  };

  return (
    <div className="overflow-x-hidden">
      {SliderSection()}
      {Info()}
      {Footer()}
    </div>
  );
};

export default Index;
