import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const SingaporeMap = ({ address, onLocationSelect }) => {
  // Singapore's center coordinates
  const center = {
    lat: 1.3521,
    lng: 103.8198
  };

  const mapStyles = {
    height: "400px",
    width: "100%"
  };

  const handleMapClick = (event) => {
    if (onLocationSelect) {
      onLocationSelect({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
    }
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <div className="rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={12}
          center={center}
          onClick={handleMapClick}
        >
          {address && <Marker position={address} />}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default SingaporeMap;