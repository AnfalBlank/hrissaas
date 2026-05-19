"use client";

import { Fragment } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const branchIcon = L.divIcon({
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
  html: `
    <div style="position:relative;width:40px;height:40px;">
      <div style="position:absolute;inset:0;background:rgba(58,92,255,0.18);border-radius:9999px;animation:pulse 2.4s ease-in-out infinite;"></div>
      <svg viewBox="0 0 24 24" fill="#3a5cff" stroke="white" stroke-width="2" style="position:absolute;left:6px;top:2px;width:28px;height:28px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
        <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    </div>
  `,
});

const employeeIcon = (initials: string, late: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="
        width:36px;height:36px;border-radius:9999px;
        background:${late ? "#f59e0b" : "#22c55e"};
        color:white;display:grid;place-items:center;
        font-weight:700;font-size:11px;font-family:Inter,sans-serif;
        box-shadow:0 4px 12px rgba(0,0,0,0.25);border:2px solid white;
      ">${initials}</div>
    `,
  });

const pinIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
  html: `
    <svg viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2" style="width:32px;height:32px;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.3));">
      <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  `,
});

export type MapBranch = {
  id: string;
  name: string;
  city?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  employees?: number;
};

export type MapEmployee = {
  id: string;
  name: string;
  branchName?: string;
  status: string;
  lat: number;
  lng: number;
};

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
};

export function LiveMap({
  branches,
  employees,
  center,
}: {
  branches: MapBranch[];
  employees: MapEmployee[];
  center?: [number, number];
}) {
  const fallbackCenter: [number, number] =
    center ??
    (branches[0]
      ? [branches[0].latitude, branches[0].longitude]
      : [-2.5489, 118.0149]);

  const zoom = branches.length > 1 ? 5 : 14;

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {branches.map((b) => (
        <Fragment key={b.id}>
          <Circle
            center={[b.latitude, b.longitude]}
            radius={b.radiusMeters ?? 100}
            pathOptions={{
              color: "#3a5cff",
              fillColor: "#3a5cff",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
          <Marker position={[b.latitude, b.longitude]} icon={branchIcon}>
            <Popup>
              <strong>{b.name}</strong>
              <br />
              {b.city ?? ""}
              <br />
              {b.employees ?? 0} pegawai · radius {b.radiusMeters ?? 100}m
            </Popup>
          </Marker>
        </Fragment>
      ))}
      {employees.map((e) => {
        const initials = e.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("");
        return (
          <Marker
            key={e.id}
            position={[e.lat, e.lng]}
            icon={employeeIcon(initials, e.status === "late")}
          >
            <Popup>
              <strong>{e.name}</strong>
              <br />
              {e.branchName ?? "—"}
              <br />
              Status: {e.status}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

/**
 * Compact map for showing a single point (mis. lokasi check-in pegawai).
 */
export function PointMap({
  lat,
  lng,
  branchLat,
  branchLng,
  branchRadius,
  branchName,
  pointTitle,
}: {
  lat: number;
  lng: number;
  branchLat?: number;
  branchLng?: number;
  branchRadius?: number;
  branchName?: string;
  pointTitle?: string;
}) {
  // Guard: pastikan lat/lng valid number
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng)
  ) {
    return (
      <div className="grid h-full w-full place-items-center bg-ink-100 text-xs text-ink-500">
        Koordinat tidak valid
      </div>
    );
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={17}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {typeof branchLat === "number" &&
        typeof branchLng === "number" &&
        !isNaN(branchLat) &&
        !isNaN(branchLng) && (
          <>
            <Circle
              center={[branchLat, branchLng]}
              radius={branchRadius ?? 100}
              pathOptions={{
                color: "#3a5cff",
                fillColor: "#3a5cff",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
            <Marker position={[branchLat, branchLng]} icon={branchIcon}>
              <Popup>
                <strong>{branchName ?? "Cabang"}</strong>
                <br />
                radius {branchRadius ?? 100}m
              </Popup>
            </Marker>
          </>
        )}
      <Marker position={[lat, lng]} icon={pinIcon}>
        <Popup>{pointTitle ?? "Lokasi"}</Popup>
      </Marker>
    </MapContainer>
  );
}
