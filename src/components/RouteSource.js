import React, { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import {
  fetchCachedRoute,
  fetchCachedRouteWithWaypoints,
} from "../services/firebase";

// Haversine distance (km)
const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    2 *
    Math.atan2(
      Math.sqrt(
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
      ),
      Math.sqrt(
        1 -
          (sinDLat * sinDLat +
            Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)
      )
    );
  return R * c;
};

const RouteSource = ({
  start,
  end,
  waypoints,
  disableApi = false,
  onRouteFound,
  isDebug = false,
  sourceId = "route",
}) => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  // You'll need to get a free Mapbox access token from https://account.mapbox.com/
  const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1IjoiYWs0NWhoaCIsImEiOiJjbWQ4Z3JxNHowMDNtMndxeGFudDVjdnExIn0.nuEfmn0U6SbyiFI_T_rnTg";

  useEffect(() => {
    if (!start || !end) return;

    const buildManualRoute = () => {
      const coords =
        Array.isArray(waypoints) && waypoints.length >= 2
          ? waypoints
          : [start, end];

      // Calculate total distance by summing segment distances
      let totalKm = 0;
      for (let i = 1; i < coords.length; i++) {
        totalKm += haversineKm(coords[i - 1], coords[i]);
      }

      const manual = {
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
        distance: totalKm, // km
        duration: null,
      };

      setRouteData(manual);
      if (onRouteFound) {
        onRouteFound({ distance: manual.distance, duration: manual.duration });
      }
    };

    const fetchRoute = async () => {
      setLoading(true);
      try {
        if (Array.isArray(waypoints) && waypoints.length >= 2) {
          // Prefer API to snap detour waypoints to real roads
          try {
            const route = await fetchCachedRouteWithWaypoints(
              waypoints,
              MAPBOX_ACCESS_TOKEN
            );
            setRouteData(route);
            if (onRouteFound) {
              onRouteFound({
                distance: route.distance,
                duration: route.duration,
              });
            }
          } catch (e) {
            console.warn("Falling back to manual detour polyline:", e.message);
            buildManualRoute();
          }
        } else {
          // Use cached route fetching via Mapbox Directions
          const route = await fetchCachedRoute(start, end, MAPBOX_ACCESS_TOKEN);
          setRouteData(route);
          if (onRouteFound) {
            onRouteFound({
              distance: route.distance,
              duration: route.duration,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        // Fallback to straight line if API fails
        setRouteData({
          geometry: {
            type: "LineString",
            coordinates: [start, end],
          },
          distance: null,
          duration: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [start, end, waypoints, disableApi, onRouteFound]);

  if (!routeData) {
    return null;
  }

  return (
    <Source
      id={sourceId}
      type="geojson"
      data={{
        type: "Feature",
        properties: {},
        geometry: routeData.geometry,
      }}
    >
      <Layer
        id={`${sourceId}-layer`}
        type="line"
        paint={{
          "line-color": isDebug ? "#ff6b35" : "#007cbf", // Orange for debug, blue for main route
          "line-width": isDebug ? 2 : 4, // Thinner for debug route
          "line-opacity": isDebug ? 0.4 : 0.8, // More transparent for debug
          "line-dasharray": isDebug ? [8, 4] : [2, 1], // Different dash pattern for debug
        }}
      />
    </Source>
  );
};

export default RouteSource;
