import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const [formData, setFormData] = useState({
    name: 'John Doe',
    address: '123 Main St, Anytown, USA',
    phone: '(555) 123-4567',
    description: '',
    date: new Date(),
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prevState => ({
      ...prevState,
      date
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Service request submitted:', { serviceId, ...formData });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-600">Book Service</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
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
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Service Address</label>
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Describe your service need</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Date</label>
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={handleDateChange}
                className="rounded-md border"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">Book Service</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceRequest;