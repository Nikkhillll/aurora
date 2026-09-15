"use client";

import React, { useEffect, useRef, useState } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  Popup,
  MapRef,
} from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { differenceInDays } from "date-fns";

import { RESUPPLY_ROUTES } from "@/data/routes";

interface ResupplyRouteMapProps {
  station: "maitri" | "bharati";
  nextResupplyDate: string;
  currentShipPosition?: {
    lat: number;
    lng: number;
    progress: number;
  };
}

interface IceRisk {
  overall_risk: "LOW" | "MEDIUM" | "HIGH";
  ice_extent_million_km2: number;
  recommendation: string;
  data_tier: string;
  data_source: string;
  waypoint_risks: Array<{
    waypoint: string;
    lat: number;
    lng: number;
    ice_edge_estimate: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
  }>;
}

interface SelectedWaypoint {
  name: string;
  lat: number;
  lng: number;
  type: "port" | "waypoint" | "station";
}

export default function ResupplyRouteMap({
  station,
  nextResupplyDate,
  currentShipPosition,
}: ResupplyRouteMapProps) {
  const [iceRisk, setIceRisk] = useState<IceRisk | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] =
    useState<SelectedWaypoint | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const route = RESUPPLY_ROUTES[station];

  // Fetch route risk from Aurora backend
  useEffect(() => {
    let cancelled = false;

    fetch(`http://127.0.0.1:8000/api/logistics/ice-risk?station=${station}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ice risk API returned ${response.status}`);
        }
        return response.json();
      })
      .then((data: IceRisk) => {
        if (!cancelled) {
          setIceRisk(data);
        }
      })
      .catch((error) => {
        console.error("Resupply ice-risk API failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [station]);

  // Force MapLibre to recalculate its dimensions after layout settles.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current.getMap();

    console.log("=== RESUPPLY MAP DEBUG ===");
    console.log("ROUTE SOURCE:", map.getSource("route"));
    console.log("ROUTE LAYER:", map.getLayer("route-line"));
    console.log("ROUTE DATA:", routeGeoJSON);

    const resizeTimer = window.setTimeout(() => {
      map.resize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
    };
  }, [mapReady]);

  const routeGeoJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: route.waypoints.map((wp) => [wp.lng, wp.lat]),
      },
    },
  ],
};

  const daysUntilResupply = Math.max(
    0,
    differenceInDays(new Date(nextResupplyDate), new Date())
  );

  const riskColor =
    iceRisk?.overall_risk === "HIGH"
      ? "#f87171"
      : iceRisk?.overall_risk === "MEDIUM"
        ? "#fbbf24"
        : "#60a5fa";

  return (
    <div className="resupply-map-container" ref={containerRef}>
      {/* HEADER */}
      <div className="countdown-header">
        <div className="countdown-value">
          <span className="days">{daysUntilResupply}</span>

          <div className="countdown-label-group">
            <span className="label">DAYS UNTIL</span>
            <span className="label-accent">NEXT RESUPPLY</span>
          </div>
        </div>

        <div className="route-info">
          <span className="route-name">{route.name}</span>

          <span className="route-meta">
            {route.total_distance_km.toLocaleString()} km
            <span className="meta-separator">•</span>
            ~{route.typical_duration_days} day voyage
          </span>
        </div>

        {iceRisk && (
          <div
            className={`ice-risk-badge risk-${iceRisk.overall_risk.toLowerCase()}`}
          >
            <span className="risk-dot" />
            <span>ICE RISK: {iceRisk.overall_risk}</span>
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="resupply-map-frame">
        <Map
          ref={mapRef}
          onLoad={() => {
            setMapReady(true);

          const bounds = new LngLatBounds();

          route.waypoints.forEach((wp) => {
          bounds.extend([wp.lng, wp.lat]);
          });

          setTimeout(() => {
            mapRef.current?.fitBounds(bounds, {
              padding: {
                top: 70,
                bottom: 70,
                left: 100,
                right: 100,
              },
              duration: 1200,
              maxZoom: 4.5,
            });
          }, 150);
        }}
          initialViewState={{
            longitude: 20,
            latitude: -50,
            zoom: 2.2,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          reuseMaps
        >

          {/* ICE ZONE */}
          {iceRisk && (
            <Source
              id="ice-zone"
              type="geojson"
              data={buildIceZoneGeoJSON(iceRisk)}
            >
              <Layer
                id="ice-fill"
                type="fill"
                paint={{
                  "fill-color": "#7dd3fc",
                  "fill-opacity": 0.18,
                }}
              />

              <Layer
                id="ice-outline"
                type="line"
                paint={{
                  "line-color": "#38bdf8",
                  "line-width": 1.5,
                  "line-dasharray": [3, 2],
                }}
              />
            </Source>
          )}

          {/* ROUTE GLOW */}
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-glow"
              type="line"
              paint={{
                "line-color": riskColor,
                "line-width": 10,
                "line-opacity": 0.22,
                "line-blur": 5,
              }}
            />

            {/* Main route */}
            <Layer
              id="route-line"
              type="line"
              layout={{
                "line-cap":"round",
                "line-join":"round",
              }}
              paint={{
                "line-color":"#ff0000",
                "line-width":8,
                "line-opacity": 1,
              }}
            />
          </Source>

          {/* WAYPOINTS */}
          {route.waypoints.map((wp, index) => (
            <Marker
              key={`${wp.name}-${index}`}
              longitude={wp.lng}
              latitude={wp.lat}
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setSelectedWaypoint({
                  name: wp.name,
                  lat: wp.lat,
                  lng: wp.lng,
                  type: wp.type,
                });
              }}
            >
              <WaypointMarker type={wp.type} />
            </Marker>
          ))}

          {/* SHIP */}
          {currentShipPosition && (
            <Marker
              longitude={currentShipPosition.lng}
              latitude={currentShipPosition.lat}
            >
              <ShipMarker />
            </Marker>
          )}

          {/* POPUP */}
          {selectedWaypoint && (
            <Popup
              longitude={selectedWaypoint.lng}
              latitude={selectedWaypoint.lat}
              onClose={() => setSelectedWaypoint(null)}
              closeButton={false}
              className="custom-popup"
              offset={16}
            >
              <div className="popup-content">
                <strong>{selectedWaypoint.name}</strong>
                <span className="popup-type">
                  {selectedWaypoint.type}
                </span>
              </div>
            </Popup>
          )}
        </Map>

        {/* MAP STATUS */}
        <div className="map-status">
          <span className="status-live-dot" />
          DERIVED ROUTE MODEL
        </div>

        <div className="map-scale-label">
          ANTARCTIC RESUPPLY CORRIDOR
        </div>
      </div>

      {/* RISK BREAKDOWN */}
      {iceRisk && (
        <div className="waypoint-risk-table">
          <div className="risk-header">
            <div>
              <h4>Route Risk Breakdown</h4>

              <p className="data-tier-label">
                <span className="tier-icon">◆</span>
                Derived — NSIDC seasonal ice climatology
              </p>
            </div>

            <div className="recommendation">
              {iceRisk.recommendation}
            </div>
          </div>

          <div className="risk-summary-grid">
            <div className="risk-summary-card">
              <span className="summary-label">OVERALL RISK</span>
              <span
                className={`summary-value risk-${iceRisk.overall_risk.toLowerCase()}`}
              >
                {iceRisk.overall_risk}
              </span>
            </div>

            <div className="risk-summary-card">
              <span className="summary-label">ICE EXTENT</span>
              <span className="summary-value">
                {iceRisk.ice_extent_million_km2}M km²
              </span>
            </div>

            <div className="risk-summary-card">
              <span className="summary-label">DATA TIER</span>
              <span className="summary-value">DERIVED</span>
            </div>
          </div>

          <div className="risk-stat-row">
            {iceRisk.waypoint_risks.map((waypoint, index) => (
              <div
                key={`${waypoint.waypoint}-${index}`}
                className="risk-stat-card"
              >
                <div className="risk-card-index">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="risk-card-content">
                  <span className="stat-label">
                    {waypoint.waypoint}
                  </span>

                  <span
                    className={`stat-value risk-${waypoint.risk_level.toLowerCase()}`}
                  >
                    {waypoint.risk_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   WAYPOINT MARKER
───────────────────────────────────────────── */

function WaypointMarker({
  type,
}: {
  type: "port" | "waypoint" | "station";
}) {
  const config = {
    port: {
      color: "#60a5fa",
      size: 12,
      icon: "⚓",
    },
    waypoint: {
      color: "#94a3b8",
      size: 7,
      icon: "",
    },
    station: {
      color: "#fb923c",
      size: 16,
      icon: "◆",
    },
  }[type];

  return (
    <div className={`waypoint-marker marker-${type}`}>
      <div
        className="marker-pulse"
        style={{ background: config.color }}
      />

      <div
        className="marker-dot"
        style={{
          background: config.color,
          width: config.size,
          height: config.size,
        }}
      >
        {config.icon && (
          <span className="marker-icon">{config.icon}</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHIP MARKER
───────────────────────────────────────────── */

function ShipMarker() {
  return (
    <div className="ship-marker">
      <div className="ship-wake" />
      <span className="ship-icon">🚢</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPROXIMATE ICE ZONE
───────────────────────────────────────────── */

function buildIceZoneGeoJSON(_iceRisk: IceRisk) {
  const points: [number, number][] = [];

  for (let lng = -60; lng <= 90; lng += 5) {
    points.push([lng, -78]);
  }

  for (let lng = 90; lng >= -60; lng -= 5) {
    points.push([lng, -63]);
  }

  points.push(points[0]);

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [points],
    },
  };
}