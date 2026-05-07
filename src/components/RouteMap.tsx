"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leaflet-fix";

interface Props {
  origenLat: number;
  origenLon: number;
  destinoLat: number;
  destinoLon: number;
  origenNombre: string;
  destinoNombre: string;
}

const originIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#4A9E5C;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.6)"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  tooltipAnchor: [8, 0],
});

const destIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#D71921;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.6)"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  tooltipAnchor: [8, 0],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] });
    }
  }, [map, positions]);
  return null;
}

export default function RouteMap({
  origenLat, origenLon, destinoLat, destinoLon, origenNombre, destinoNombre,
}: Props) {
  const [routePositions, setRoutePositions] = useState<[number, number][]>([]);
  const center: [number, number] = [
    (origenLat + destinoLat) / 2,
    (origenLon + destinoLon) / 2,
  ];

  useEffect(() => {
    const fetchRoute = async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${origenLon},${origenLat};${destinoLon},${destinoLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
        setRoutePositions(
          data.routes[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
          )
        );
      }
    };
    fetchRoute().catch(console.error);
  }, [origenLat, origenLon, destinoLat, destinoLon]);

  const boundsPositions: [number, number][] =
    routePositions.length >= 2
      ? routePositions
      : [[origenLat, origenLon], [destinoLat, destinoLon]];

  const shortName = (s: string) => s.split(",")[0].trim();

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <FitBounds positions={boundsPositions} />

      <Marker position={[origenLat, origenLon]} icon={originIcon}>
        <Tooltip permanent direction="right" offset={[10, 0]}>
          <span style={{ fontFamily: "monospace", fontSize: "11px" }}>
            {shortName(origenNombre)}
          </span>
        </Tooltip>
      </Marker>

      <Marker position={[destinoLat, destinoLon]} icon={destIcon}>
        <Tooltip permanent direction="right" offset={[10, 0]}>
          <span style={{ fontFamily: "monospace", fontSize: "11px" }}>
            {shortName(destinoNombre)}
          </span>
        </Tooltip>
      </Marker>

      {routePositions.length > 0 && (
        <Polyline
          positions={routePositions}
          color="#5B9BF6"
          weight={3}
          opacity={0.9}
        />
      )}
    </MapContainer>
  );
}
