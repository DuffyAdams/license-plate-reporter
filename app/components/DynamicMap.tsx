'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: '/assets/marker.png',
  iconSize: [35, 35],
  iconAnchor: [12, 35],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface DynamicMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  isThumbnail?: boolean;
}

function LocationMarker({ onLocationSelect, selectedLocation, isThumbnail }: DynamicMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setPosition(L.latLng(selectedLocation.lat, selectedLocation.lng));
    }
  }, [selectedLocation]);

  const map = useMapEvents({
    click(e: L.LeafletMouseEvent) {
      if (!isThumbnail) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon}>
      <Popup>Estimated location of incident</Popup>
    </Marker>
  );
}

export default function DynamicMap({ onLocationSelect, selectedLocation, isThumbnail }: DynamicMapProps) {
  // Default center (somewhere in the US)
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <MapContainer
      center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
      zoom={selectedLocation ? (isThumbnail ? 13 : 15) : 4}
      style={{ height: '100%', width: '100%', position: 'relative', zIndex: 40 }}
      className={isThumbnail ? "rounded" : "rounded-lg"}
      zoomControl={true}
      dragging={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
        maxZoom={15}
      />
      <LocationMarker onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} isThumbnail={isThumbnail} />
    </MapContainer>
  );
}