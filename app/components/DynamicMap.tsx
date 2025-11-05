'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DynamicMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

function LocationMarker({ onLocationSelect, selectedLocation }: DynamicMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setPosition(L.latLng(selectedLocation.lat, selectedLocation.lng));
    }
  }, [selectedLocation]);

  const map = useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Estimated location of incident</Popup>
    </Marker>
  );
}

export default function DynamicMap({ onLocationSelect, selectedLocation }: DynamicMapProps) {
  // Default center (somewhere in the US)
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <MapContainer
      center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
      zoom={selectedLocation ? 15 : 4}
      style={{ height: '256px', width: '100%' }}
      className="rounded-lg"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />
      <LocationMarker onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} />
    </MapContainer>
  );
}