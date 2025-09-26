import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BookingFlow from "@/components/BookingFlow";

const ServiceRequest = () => {
  const { serviceType: paramServiceType } = useParams();
  const [searchParams] = useSearchParams();
  const queryServiceType = searchParams.get('service');
  
  // Use path param first, then query param as fallback
  const serviceType = paramServiceType || queryServiceType;
  
  return <BookingFlow serviceType={serviceType} />;
};

export default ServiceRequest;