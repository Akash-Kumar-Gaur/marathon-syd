import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

const RouteControl = ({ start, end }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    const control = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "walking",
      }),
      lineOptions: {
        styles: [{ color: "#3388ff", opacity: 0.8, weight: 2 }],
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
