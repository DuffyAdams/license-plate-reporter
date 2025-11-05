'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map to avoid SSR issues
const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#171d24] rounded flex items-center justify-center text-[#94a3b8]">Loading map...</div>
});

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  isThumbnail?: boolean;
}

export default function MapComponent({ onLocationSelect, selectedLocation, isThumbnail }: MapComponentProps) {
  return (
    <div className={isThumbnail ? "h-full w-full bg-[#171d24] rounded overflow-hidden" : "h-64 bg-[#171d24] rounded-lg overflow-hidden"}>
      <DynamicMap onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} isThumbnail={isThumbnail} />
    </div>
  );
}