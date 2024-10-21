import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import "../location.css";

const ContractorMain = () => {
  const listing = {
    name: "John Doe",
    service: "Air conditioning repair",
    date: "12 November 2024",
    phone: "123-456-7890",
  };

  const [recentRequests, setRecentRequests] = useState([
    { id: 1, service: "Plumbing", date: "2023-03-15", status: "Completed" },
    {
      id: 2,
      service: "House Cleaning",
      date: "2023-03-20",
      status: "In Progress",
    },
  ]);

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

  const [mapSrc, setMapSrc] = useState(locations[0].mapSrc);
  const [showPopup, setShowPopup] = useState(false); // State for pop-up visibility
  const [selectedDetails, setSelectedDetails] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(null); // To store selected location ID

  const changeLocation = (src) => {
    setMapSrc(src);
  };

  const openPopup = (details, id) => {
    setSelectedDetails(details);
    setSelectedLocationId(id); // Store the selected location ID
    setShowPopup(true);
  };

  // Function to close the pop-up
  const closePopup = () => {
    setShowPopup(false);
  };

  const getFormattedDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0"); // Get day and pad with leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Get month (0-11) and pad with leading zero
    const year = date.getFullYear(); // Get full year
    return `${day}-${month}-${year}`; // Return formatted date
  };

  const acceptRequest = () => {
    if (selectedLocationId !== null) {
      // Remove the accepted location from the state
      setLocations((prevLocations) =>
        prevLocations.filter((location) => location.id !== selectedLocationId)
      );

      // Add to recent requests
      const acceptedRequest = {
        id: recentRequests.length + 1, // Generate a new id
        service: selectedDetails.name, // Assuming the service name is the location name
        date: getFormattedDate(), // Current date
        status: "Accepted", // Update the status
      };

      setRecentRequests((prevRequests) => [...prevRequests, acceptedRequest]);
    }
    closePopup(); // Close the popup after accepting the request
  };

  const LocationItem = ({ name, address, hours, details, mapSrc, id }) => (
    <div className="location-button">
      <a onClick={() => changeLocation(mapSrc)} style={{ cursor: "pointer" }}>
        {name}
        <div className="location-hours">{address}</div>
        <div className="location-hours">{hours}</div>
        <Button
          onClick={() => openPopup(details, id)} // Pass id to openPopup
          className="mt-3 bg-blue-500 hover:bg-blue-600"
        >
          Details
        </Button>
      </a>
    </div>
  );

  return (
    <div className="location-main min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-14 text-center text-blue-600 mx-auto max-w-3xl">
        Welcome back, Contractor!
      </h1>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md min-w-[600px]">
            <h2 className="text-2xl font-bold mb-4">Location Details</h2>
            <div className="flex flex-col gap-4 pb-6">
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {selectedDetails.name}
              </p>
              <p>
                <span className="font-semibold">Service:</span>{" "}
                {selectedDetails.service}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {selectedDetails.date}
              </p>
              <p>
                <span className="font-semibold">Contact:</span>{" "}
                {selectedDetails.phone}
              </p>
              <p>
                <span className="font-semibold">Address:</span>{" "}
                {selectedDetails.address}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {selectedDetails.hours}
              </p>
            </div>
            <div className="flex gap-5">
              <Button
                onClick={acceptRequest}
                className="bg-green-500 hover:bg-green-600"
              >
                Accept
              </Button>
              <Button
                onClick={closePopup}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="location-container max-w-3xl mx-auto space-y-14">
        <div>
          <div className="text-3xl font-bold mb-10">Summary</div>
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-600">
                Recent Service Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {recentRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-semibold">{request.service}</p>
                      <p className="text-sm text-gray-600">{request.date}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        request.status === "Completed"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {request.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div>
          <div className="text-3xl font-bold mb-10">New requests</div>
          <div className="flex flex-row w-full">
            <div className="location-list w-1/2 overflow-auto">
              {locations.map((location, index) => (
                <LocationItem
                  key={index}
                  name={location.name}
                  address={location.address}
                  hours={location.hours}
                  details={location}
                  mapSrc={location.mapSrc}
                  id={location.id}
                />
              ))}
            </div>
            <p className="w-1/2">
              <iframe
                id="map"
                className="map"
                src={mapSrc}
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </p>
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold mb-10">Open requests</div>

          <Carousel>
            <CarouselPrevious />
            <CarouselContent>
              {locations.map((location) => (
                <CarouselItem key={location.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-blue-600">
                        {location.service}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>
                        <span className="font-semibold">Name:</span>{" "}
                        {location.name}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span>{" "}
                        {location.date}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        {location.phone}
                      </p>
                      <Button
                        onClick={() => openPopup(location, location.id)} // Use location.id for consistency
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Details
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselNext />
          </Carousel>
        </div>
        <div>
          <div className="text-3xl font-bold mb-10">Upcoming</div>

          <Carousel>
            <CarouselPrevious />
            <CarouselContent>
              {locations.map((location) => (
                <CarouselItem key={location.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-blue-600">
                        {location.service}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>
                        <span className="font-semibold">Name:</span>{" "}
                        {location.name}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span>{" "}
                        {location.date}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        {location.phone}
                      </p>
                      <Button
                        onClick={() => openPopup(location, location.id)} // Use location.id for consistency
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Details
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default ContractorMain;
