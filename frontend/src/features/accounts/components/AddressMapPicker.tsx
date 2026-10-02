"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface AddressMapPickerProps {
  onAddressSelect: (address: string) => void;
  searchValue?: string;
}

function MapEventsAndMarker({ 
  onLocationSelected, 
  markerPos 
}: { 
  onLocationSelected: (lat: number, lng: number) => void;
  markerPos: L.LatLng | null;
}) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });

  return markerPos === null ? null : (
    <Marker position={markerPos}></Marker>
  );
}

function MapFlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function AddressMapPicker({ onAddressSelect, searchValue }: AddressMapPickerProps) {
  const [loading, setLoading] = useState(false);
  const [markerPos, setMarkerPos] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Debounced search when searchValue changes
  useEffect(() => {
    if (!searchValue || searchValue.length < 4) return;

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
          setMarkerPos(new L.LatLng(lat, lon));
        }
      } catch (err) {
        console.error("Geocoding search failed", err);
      }
    }, 1200); // Wait 1.2s after user stops typing to avoid spamming the API

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      setMarkerPos(new L.LatLng(lat, lng));
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        onAddressSelect(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[300px] rounded-md border border-slate-200 overflow-hidden relative z-0">
      <MapContainer center={[36.8065, 10.1815]} zoom={13} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFlyTo center={mapCenter} />
        <MapEventsAndMarker onLocationSelected={reverseGeocode} markerPos={markerPos} />
      </MapContainer>
      {loading && (
        <div className="absolute inset-0 bg-white/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        </div>
      )}
      <div className="absolute top-2 right-2 z-[1000] bg-white text-xs px-2 py-1 rounded shadow text-slate-600 pointer-events-none">
        Cliquez sur la carte ou tapez pour rechercher
      </div>
    </div>
  );
}
