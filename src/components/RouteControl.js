import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
// import "lrm-graphhopper"; // Keep for future use

// Helper function to add direction arrows to route
const addDirectionArrows = (routeLayer, map) => {
  if (!routeLayer || !routeLayer.getLatLngs) return;

  const latlngs = routeLayer.getLatLngs();
  if (latlngs.length < 2) return;

  // Add fewer arrows, every ~20% of the route
  const totalPoints = latlngs.length;
  const arrowPositions = [
    Math.floor(totalPoints * 0.25),
    Math.floor(totalPoints * 0.5),
    Math.floor(totalPoints * 0.75),
  ];

  arrowPositions.forEach((i) => {
    if (i > 0 && i < latlngs.length - 1) {
      const start = latlngs[i - 1];
      const end = latlngs[i + 1];

      if (start && end) {
        // Calculate bearing for arrow direction
        const bearing =
          (Math.atan2(end.lng - start.lng, end.lat - start.lat) * 180) /
            Math.PI +
          90; // +90 to point forward

        // Create arrow marker with FontAwesome icon
        const arrowIcon = L.divIcon({
          html: `<i class="fas fa-location-arrow" style="
            color: #0096DB; 
            font-size: 16px; 
            transform: rotate(${bearing}deg);
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          "></i>`,
          className: "route-arrow-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const arrow = L.marker([latlngs[i].lat, latlngs[i].lng], {
          icon: arrowIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        // Store arrow reference for cleanup
        if (!routeLayer._arrows) routeLayer._arrows = [];
        routeLayer._arrows.push(arrow);
      }
    }
  });
};

const RouteControl = ({
  start,
  end,
  viaPoints = [],
  animate = false,
  onRouteFound,
  onRoutePlotted,
}) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;

    if (!map || !start || !end) return;

    // Add a small delay to ensure map is fully ready
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current || !map) return;

      try {
        // Offset the end point slightly to make the route line end at the bottom center of the marker
        const markerOffset = 0.0002;
        const adjustedEnd = [end[0] - markerOffset, end[1]];

        // Build waypoints array: start -> via points -> end
        const waypoints = [
          L.latLng(start[0], start[1]),
          ...viaPoints.map((point) => L.latLng(point[0], point[1])),
          L.latLng(adjustedEnd[0], adjustedEnd[1]),
        ];

        console.log(
          "Creating route with waypoints:",
          waypoints.length,
          "points"
        );

        const control = L.Routing.control({
          waypoints: waypoints,
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "foot",
            timeout: 10000,
          }),
          lineOptions: {
            styles: [
              {
                color: "#0096DB",
                opacity: 0.8,
                weight: 4,
                dashArray: "8 8",
              },
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

        // Add error handling for route events
        control.on("routesfound", (e) => {
          if (!isMountedRef.current) {
            try {
              if (map && control && typeof control.remove === "function") {
                map.removeControl(control);
              }
            } catch (error) {
              console.warn("Error removing control after route found:", error);
            }
            return;
          }

          console.log(
            "Route found with",
            viaPoints.length,
            "via points, animate:",
            animate
          );

          // Extract route distance and pass it back
          if (e.routes && e.routes[0] && onRouteFound) {
            const route = e.routes[0];
            const distanceKm = route.summary.totalDistance / 1000; // Convert meters to km
            console.log("Actual route distance:", distanceKm.toFixed(2), "km");
            onRouteFound(distanceKm);
          }

          // Recenter map to show full route after plotting
          if (e.routes && e.routes[0] && onRoutePlotted) {
            setTimeout(() => {
              if (isMountedRef.current && map) {
                try {
                  // Get all route coordinates to fit the entire route
                  const routeCoords = e.routes[0].coordinates || [];
                  if (routeCoords.length > 0) {
                    // Create bounds that include start, end, and route points
                    const bounds = L.latLngBounds([
                      [start[0], start[1]],
                      [end[0], end[1]],
                      ...routeCoords.map((coord) => [coord.lat, coord.lng]),
                    ]);

                    // Fit map to show entire route with padding
                    map.fitBounds(bounds, {
                      padding: [20, 20],
                      maxZoom: 16,
                      animate: true,
                    });
                    console.log("Map recentered to show full route");
                  }
                } catch (error) {
                  console.warn("Error recentering map:", error);
                }
              }
            }, 200); // Slight delay to ensure route is fully drawn
          }

          if (animate && e.routes && e.routes[0]) {
            // Add animation effect after route is drawn
            setTimeout(() => {
              if (isMountedRef.current && control._line) {
                const routeLayer = control._line;
                // Add CSS class for animation
                if (routeLayer._path) {
                  routeLayer._path.classList.add("route-draw-animation");
                }

                // Add direction arrows
                try {
                  addDirectionArrows(routeLayer, map);
                } catch (error) {
                  console.warn("Error adding direction arrows:", error);
                }
              }
            }, 100);
          }
        });

        control.on("routingerror", (e) => {
          console.warn("Routing error:", e);

          // Draw a simple line through via points as fallback
          if (isMountedRef.current && map) {
            try {
              const fallbackPoints = [
                [start[0], start[1]],
                ...viaPoints,
                [adjustedEnd[0], adjustedEnd[1]],
              ];

              const fallbackLine = L.polyline(fallbackPoints, {
                color: "#0096DB",
                opacity: 0.8,
                weight: 3,
                dashArray: "8 8",
              }).addTo(map);

              // Store the fallback line for cleanup
              routingControlRef.current = { _fallbackLine: fallbackLine };
              console.log(
                "Added fallback line route with",
                viaPoints.length,
                "via points"
              );
            } catch (error) {
              console.warn("Error creating fallback route:", error);
            }
          }
        });

        // Add additional error handlers to prevent removeLayer errors
        control.on("error", (e) => {
          console.warn("Routing control error:", e);
        });

        if (isMountedRef.current && map) {
          try {
            routingControlRef.current = control;
            map.addControl(control);
            console.log(
              "Route control added to map with",
              viaPoints.length,
              "via points"
            );
          } catch (error) {
            console.warn("Error adding control to map:", error);
          }
        }
      } catch (error) {
        console.warn("Error creating routing control:", error);
      }
    }, 100);

    return () => {
      isMountedRef.current = false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (routingControlRef.current && map) {
        try {
          // Clean up arrows first
          if (
            routingControlRef.current._line &&
            routingControlRef.current._line._arrows
          ) {
            routingControlRef.current._line._arrows.forEach((arrow) => {
              try {
                if (map.hasLayer && map.hasLayer(arrow)) {
                  map.removeLayer(arrow);
                }
              } catch (e) {
                console.warn("Error removing arrow:", e);
              }
            });
          }

          // Handle fallback line removal
          if (routingControlRef.current._fallbackLine) {
            try {
              if (
                map.hasLayer &&
                map.hasLayer(routingControlRef.current._fallbackLine)
              ) {
                map.removeLayer(routingControlRef.current._fallbackLine);
              }
            } catch (error) {
              console.warn("Error removing fallback line:", error);
            }
          } else if (
            routingControlRef.current &&
            typeof routingControlRef.current.remove === "function"
          ) {
            // Handle normal routing control removal with additional safety checks
            try {
              // Try to clear any internal layers first
              if (
                routingControlRef.current._line &&
                map.hasLayer &&
                map.hasLayer(routingControlRef.current._line)
              ) {
                map.removeLayer(routingControlRef.current._line);
              }
            } catch (error) {
              console.warn("Error removing route line:", error);
            }

            try {
              map.removeControl(routingControlRef.current);
            } catch (error) {
              console.warn("Error removing routing control:", error);
            }
          }
        } catch (error) {
          console.warn("Error during routing control cleanup:", error);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, start, end, viaPoints, animate, onRouteFound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
};

export default RouteControl;
