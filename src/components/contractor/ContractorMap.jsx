import React from 'react';
import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from 'lucide-react';

const ContractorMap = ({ mapSrc, onLocationChange }) => {
  return (
    <Card className="h-[500px] w-full overflow-hidden">
      <div className="p-4 bg-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Service Locations</h3>
        </div>
        <Navigation className="h-5 w-5 text-blue-500" />
      </div>
      <iframe
        className="w-full h-[calc(100%-4rem)]"
        src={mapSrc}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </Card>
  );
};

export default ContractorMap;