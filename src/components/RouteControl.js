import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
// import "lrm-graphhopper"; // Keep for future use

const RouteControl = ({ start, end }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Offset the end point slightly to make the route line end at the bottom center of the marker
    const markerOffset = 0.0002; // Adjust as needed for your marker size and zoom
    const adjustedEnd = [end[0] - markerOffset, end[1]];

    const control = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(adjustedEnd[0], adjustedEnd[1]),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "walking",
      }),
      lineOptions: {
        styles: [
          { color: "#0096DB", opacity: 0.8, weight: 3, dashArray: "8 8" },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 100,
      },
      createMarker: () => null,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      show: false,
    });

    routingControlRef.current = control;
    map.addControl(control);

    return () => {
      if (routingControlRef.current) {
        routingControlRef.current
          .getPlan()
          .getWaypoints()
          .forEach(() => {
            if (routingControlRef.current && routingControlRef.current._plan) {
              routingControlRef.current._plan.spliceWaypoints(0, 1);
            }
          });

        if (map && routingControlRef.current) {
          try {
            map.removeControl(routingControlRef.current);
          } catch (error) {
            console.warn("Error removing routing control:", error);
          }
        }

        routingControlRef.current = null;
      }
    };
  }, [map, start, end]);

  return null;
};

export default RouteControl;
