import React, { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import { fetchCachedRoute } from "../services/firebase";

const RouteSource = ({
  start,
  end,
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

    const fetchRoute = async () => {
      setLoading(true);
      try {
        // Use cached route fetching
        const route = await fetchCachedRoute(start, end, MAPBOX_ACCESS_TOKEN);

        setRouteData(route);

        if (onRouteFound) {
          onRouteFound({
            distance: route.distance,
            duration: route.duration,
          });
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
