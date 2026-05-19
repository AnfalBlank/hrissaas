"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Map picker component — user klik di peta untuk set pin lokasi.
 * Menampilkan radius circle di sekitar pin.
 */
export function MapPicker({
  latitude,
  longitude,
  radius,
  onLocationChange,
}: {
  latitude: number;
  longitude: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    // Custom pin icon
    const pinIcon = L.divIcon({
      className: "custom-pin",
      html: `<div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, #3A5CFF, #6366F1);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(58,92,255,0.4);
      "><div style="
        width: 10px; height: 10px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
      "></div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([latitude, longitude], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    const circle = L.circle([latitude, longitude], {
      radius,
      color: "#3A5CFF",
      fillColor: "#3A5CFF",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // Drag marker → update coords
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      circle.setLatLng(pos);
      onLocationChange(
        Math.round(pos.lat * 1_000_000) / 1_000_000,
        Math.round(pos.lng * 1_000_000) / 1_000_000
      );
    });

    // Click map → move marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onLocationChange(
        Math.round(e.latlng.lat * 1_000_000) / 1_000_000,
        Math.round(e.latlng.lng * 1_000_000) / 1_000_000
      );
    });

    mapInstance.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  // Update marker/circle position when lat/lng changes externally
  useEffect(() => {
    if (markerRef.current && mapInstance.current) {
      const current = markerRef.current.getLatLng();
      if (
        Math.abs(current.lat - latitude) > 0.0001 ||
        Math.abs(current.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        circleRef.current?.setLatLng([latitude, longitude]);
        mapInstance.current.setView([latitude, longitude], 16);
      }
    }
  }, [latitude, longitude]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        onLocationChange(
          Math.round(newLat * 1_000_000) / 1_000_000,
          Math.round(newLng * 1_000_000) / 1_000_000
        );
        if (mapInstance.current) {
          mapInstance.current.setView([newLat, newLng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
        if (circleRef.current) {
          circleRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        alert("Lokasi tidak ditemukan. Coba kata kunci lain.");
      }
    } catch {
      alert("Gagal mencari lokasi. Cek koneksi internet.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Cari alamat atau nama tempat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {searching ? "..." : "Cari"}
        </button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="h-[300px] w-full rounded-2xl border border-ink-200 overflow-hidden"
      />

      {/* Hint */}
      <p className="text-[11px] text-ink-500">
        💡 Klik di peta atau drag pin untuk menentukan lokasi. Gunakan search
        untuk cari alamat. Lingkaran biru menunjukkan radius geofence.
      </p>
    </div>
  );
}
