import React, { useState } from "react";
import ContractorMap from "@/components/contractor/ContractorMap";
import NewRequests from "@/components/contractor/NewRequests";
import RecentRequests from "@/components/contractor/RecentRequests";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ContractorMain = () => {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [proposedPrice, setProposedPrice] = useState("");
  const [recentRequests, setRecentRequests] = useState([
    { 
      id: 1, 
      service: "Plumbing", 
      date: "2023-03-15", 
      status: "Completed",
      progress: 100 
    },
    { 
      id: 2, 
      service: "House Cleaning", 
      date: "2023-03-20", 
      status: "In Progress",
      progress: 60 
    },
  ]);

  const [locations, setLocations] = useState([
    {
      id: 1,
      name: "ION Orchard",
      service: "Air conditioning repair",
      date: "12 November 2024",
      phone: "123-456-7890",
      address: "#B4-06",
      hours: "5 minutes ago",
      minPrice: 100,
      maxPrice: 300,
      image: "https://example.com/location1.jpg",
      progress: 0,
      status: "submitted",
      mapSrc: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
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

  const handleAcceptRequest = (request) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== request.id));
    setRecentRequests((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        service: request.service,
        date: new Date().toLocaleDateString(),
        status: "Accepted",
        progress: 0,
      },
    ]);
    toast({
      title: "Request Accepted",
      description: `You've accepted the service request at ${request.name}`,
    });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleSubmitPrice = () => {
    if (selectedRequest && proposedPrice) {
      // Here you would typically emit this to the server
      toast({
        title: "Price Submitted",
        description: `Your price of $${proposedPrice} has been submitted.`,
      });
      setSelectedRequest(null);
      setProposedPrice("");
    }
  };

  const handleUpdateProgress = (requestId, newProgress) => {
    setRecentRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, progress: newProgress, status: newProgress === 100 ? "Completed" : "In Progress" }
          : req
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
        Welcome back, Contractor!
      </h1>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <NewRequests 
            requests={locations} 
            onAccept={handleAcceptRequest}
            onViewDetails={handleViewDetails}
          />
          <RecentRequests 
            requests={recentRequests}
            onUpdateProgress={handleUpdateProgress}
          />
        </div>
        <div className="space-y-8">
          <ContractorMap mapSrc={locations[0]?.mapSrc} />
        </div>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {selectedRequest.image && (
                <img 
                  src={selectedRequest.image} 
                  alt="Location" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <p className="font-semibold">Location: {selectedRequest.name}</p>
                <p>Address: {selectedRequest.address}</p>
                <p>Service: {selectedRequest.service}</p>
                <p>Customer's Price Range: ${selectedRequest.minPrice} - ${selectedRequest.maxPrice}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Price (SGD)</label>
                <Input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="Enter your price"
                />
              </div>
              <Button onClick={handleSubmitPrice} className="w-full">
                Submit Price
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorMain;
