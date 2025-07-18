import React, { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/mapbox";

const RouteSource = ({ start, end, onRouteFound }) => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  // You'll need to get a free Mapbox access token from https://account.mapbox.com/
  const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1IjoiYWs0NWhoaCIsImEiOiJjbWQ4Z3JxNHowMDNtMndxeGFudDVjdnExIn0.nuEfmn0U6SbyiFI_T_rnTg";

  useEffect(() => {
    if (!start || !end) return;

    const fetchRoute = async () => {
      setLoading(true);
      try {
        // Use Mapbox Directions API to get walking route
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
        );

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData({
            geometry: route.geometry,
            distance: route.distance / 1000, // Convert to kilometers
            duration: route.duration / 60, // Convert to minutes
          });

          if (onRouteFound) {
            onRouteFound({
              distance: route.distance / 1000,
              duration: route.duration / 60,
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
  }, [start, end, onRouteFound]);

  if (!routeData) {
    return null;
  }

  return (
    <Source
      id="route"
      type="geojson"
      data={{
        type: "Feature",
        properties: {},
        geometry: routeData.geometry,
      }}
    >
      <Layer
        id="route-layer"
        type="line"
        paint={{
          "line-color": "#007cbf",
          "line-width": 4,
          "line-opacity": 0.8,
        }}
      />
    </Source>
  );
};

export default RouteSource;
