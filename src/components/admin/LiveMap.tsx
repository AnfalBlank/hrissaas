"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon path issue with Webpack
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
        font-weight:700;font-size:11px;font-family:Inter;
        box-shadow:0 4px 12px rgba(0,0,0,0.25);border:2px solid white;
      ">${initials}</div>
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

export function LiveMap({
  branches,
  employees,
  center,
}: {
  branches: MapBranch[];
  employees: MapEmployee[];
  center?: [number, number];
}) {
  const fallbackCenter: [number, number] = center ??
    (branches[0]
      ? [branches[0].latitude, branches[0].longitude]
      : [-2.5489, 118.0149]);

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={branches.length > 1 ? 5 : 14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: 24 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {branches.map((b) => (
        <div key={b.id}>
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
        </div>
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
