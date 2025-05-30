import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Camera, Upload, MapPin, Star, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import routes from "@/routes/routes";

const singaporeCenter = {
  lat: 1.3521,
  lng: 103.8198,
};

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: "John Doe",
    address: "123 Main St, Singapore",
    phone: "(555) 123-4567",
    description: "",
    date: new Date(),
    image: null,
    minPrice: 50,
    maxPrice: 200,
    location: null,
    contractorType: "recommended", // Added contractor type field
  });

  const navigate = useNavigate();

  const handleMapClick = useCallback((event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setSelectedLocation(newLocation);
    setFormData((prev) => ({
      ...prev,
      location: newLocation,
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (date) => {
    setFormData((prevState) => ({
      ...prevState,
      date,
    }));
  };

  const handleSubmit = () => {
    // Saving formData to sessionStorage
    sessionStorage.setItem("isJobInProgress", "true");
    sessionStorage.setItem("latestJob", JSON.stringify(formData));
    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map.",
        variant: "destructive",
      });
      navigate(routes.customerMain);
      return;
    }
    // Here you would typically send the data to your server
    toast({
      title: "Service Request Submitted",
      description: "Your request has been sent to nearby contractors.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#283579]">
            Book Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="rounded-lg overflow-hidden">
                <LoadScript>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={singaporeCenter}
                    zoom={12}
                    onClick={handleMapClick}
                  >
                    {selectedLocation && (
                      <Marker
                        position={selectedLocation}
                        icon={{
                          path: MapPin,
                          fillColor: "#2563eb",
                          fillOpacity: 1,
                          strokeWeight: 0,
                          scale: 2,
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Your Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Service Address
                    </label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Describe your service need
                    </label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your service need"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  {/* Contractor Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Contractor Type
                    </label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={
                          formData.contractorType === "recommended"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            contractorType: "recommended",
                          }))
                        }
                        className="flex items-center gap-2"
                      >
                        <Star className="text-yellow-500 w-4 h-4" />
                        Recommended
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.contractorType === "saver"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            contractorType: "saver",
                          }))
                        }
                        className="flex items-center gap-2 py-5 px-8"
                      >
                        <DollarSign className="text-green-500 w-4 h-4" />
                        Saver
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Attach image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {formData.image ? (
                          <img
                            src={formData.image}
                            alt="Location"
                            className="mx-auto h-32 w-auto"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-[#283579] hover:text-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={handleImageUpload}
                                  accept="image/*"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price Range (SGD)
                    </label>
                    <div className="flex gap-4 mt-1">
                      <Input
                        type="number"
                        name="minPrice"
                        value={formData.minPrice}
                        onChange={handleInputChange}
                        placeholder="Min"
                        className="w-1/2"
                      />
                      <Input
                        type="number"
                        name="maxPrice"
                        value={formData.maxPrice}
                        onChange={handleInputChange}
                        placeholder="Max"
                        className="w-1/2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Date
                    </label>
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateChange}
                      className="rounded-md border mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div onClick={handleSubmit}>
              <Button
                type="submit"
                className="w-full bg-[#283579] hover:bg-blue-600"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceRequest;
