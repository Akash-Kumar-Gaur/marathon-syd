import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Wayfinder.css";
import Header from "../components/Header";
import RouteSource from "../components/RouteSource";
import { getCachedDistance } from "../services/firebase";
import { findParticipantByBIB } from "../wayfinder-data-index.js";
import { isCurrentlyInClosurePeriod } from "../time-utility.js";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiYWs0NWhoaCIsImEiOiJjbWQ4Z3JxNHowMDNtMndxeGFudDVjdnExIn0.nuEfmn0U6SbyiFI_T_rnTg"; // Replace with your token

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  return getCachedDistance([lon1, lat1], [lon2, lat2]);
};

// Utility function to convert coordinates from [lat, lng] to [lng, lat] for Mapbox
const convertToMapboxFormat = (coordinates) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }
  // Convert from [lat, lng] to [lng, lat] for Mapbox
  return [coordinates[1], coordinates[0]];
};

// Ultra-fast BIB lookup function using new chunked data
const getBibData = (bibNumber) => {
  return findParticipantByBIB(bibNumber);
};

// Function to calculate detour coordinates around Ped Crossing areas
const calculateDetourRoute = (
  startCoords,
  endCoords,
  pedCrossingCoords,
  allRoutesClosed = false,
  blockedPoints = []
) => {
  console.log("🔄 [ROUTE DEBUG] calculateDetourRoute called");
  console.log("📍 [ROUTE DEBUG] Start coordinates:", startCoords);
  console.log("🎯 [ROUTE DEBUG] End coordinates:", endCoords);
  console.log("🚸 [ROUTE DEBUG] Ped Crossing coordinates:", pedCrossingCoords);
  console.log("🚫 [ROUTE DEBUG] All routes closed:", allRoutesClosed);

  if (!startCoords || !endCoords) {
    console.log("❌ [ROUTE DEBUG] Missing start or end coordinates");
    return null;
  }

  const start = Array.isArray(startCoords)
    ? startCoords
    : convertToMapboxFormat(startCoords);
  const end = Array.isArray(endCoords)
    ? endCoords
    : convertToMapboxFormat(endCoords);

  if (!start || !end) {
    console.log(
      "❌ [ROUTE DEBUG] Failed to convert coordinates to Mapbox format"
    );
    return null;
  }

  console.log("🗺️ [ROUTE DEBUG] Mapbox format - Start:", start);
  console.log("🗺️ [ROUTE DEBUG] Mapbox format - End:", end);

  if (allRoutesClosed) {
    console.log(
      "🚫 [ROUTE DEBUG] All routes closed - creating comprehensive detour"
    );
    // All Ped Crossings are closed - use comprehensive detour
    return createComprehensiveDetour(start, end, blockedPoints);
  }

  if (pedCrossingCoords) {
    console.log(
      "🚸 [ROUTE DEBUG] Specific Ped Crossing provided - creating detour around it"
    );
    // Specific Ped Crossing is closed - create detour around it
    const pedCrossing = Array.isArray(pedCrossingCoords)
      ? pedCrossingCoords
      : convertToMapboxFormat(pedCrossingCoords);
    if (!pedCrossing) {
      console.log(
        "❌ [ROUTE DEBUG] Failed to convert Ped Crossing coordinates"
      );
      return null;
    }
    console.log("🗺️ [ROUTE DEBUG] Mapbox format - Ped Crossing:", pedCrossing);
    // Create a simple right-turn detour: approach crossing, turn right, proceed on parallel road
    console.log("🔄 [ROUTE DEBUG] Creating simple right-turn detour");
    return createSimpleRightTurnDetour(start, end, pedCrossing, blockedPoints);
  }

  console.log("✅ [ROUTE DEBUG] No detour needed - returning direct route");
  // No detour needed
  return {
    type: "direct",
    waypoints: [start, end],
    detourReason: "No detour needed",
    originalRoute: [start, end],
    detourDistance: 0,
    originalDistance:
      calculateDistance(start[1], start[0], end[1], end[0]) * 1000,
    safetyFeatures: ["Direct route - no Ped Crossings in path"],
  };
};

// Create comprehensive detour when all routes are closed
const createComprehensiveDetour = (start, end, blockedPoints = []) => {
  console.log("🔄 [DETOUR DEBUG] Creating comprehensive detour");
  console.log("📍 [DETOUR DEBUG] Start:", start);
  console.log("🎯 [DETOUR DEBUG] End:", end);
  console.log(
    "🚸 [DETOUR DEBUG] Blocked points to avoid:",
    blockedPoints.length
  );

  const [startLng, startLat] = start;
  const [endLng, endLat] = end;

  // Calculate route direction and distance
  const routeAngle = Math.atan2(endLat - startLat, endLng - startLng);
  console.log(
    "🧭 [DETOUR DEBUG] Route angle (radians):",
    routeAngle.toFixed(4)
  );

  // Determine if route is mostly north-south or east-west
  const isNorthSouth =
    Math.abs(endLat - startLat) > Math.abs(endLng - startLng);
  console.log(
    "🧭 [DETOUR DEBUG] Route orientation:",
    isNorthSouth ? "North-South" : "East-West"
  );

  // Create a complete barrier around all crossings - use larger offsets
  const minClearKm = 0.12; // ~120m min clearance from any blocked crossing
  const minOffset = 0.0006; // ~60-70m (next major side street)
  const maxOffset = 0.0015; // ~150-180m (major parallel road)
  const step = 0.0001; // ~10m

  const buildCandidate = (offset, sign) => {
    if (isNorthSouth) {
      const detourLng = startLng + sign * offset;
      const detourLat = startLat;
      const parallelLng = detourLng;
      const parallelLat = endLat;
      return [start, [detourLng, detourLat], [parallelLng, parallelLat], end];
    } else {
      const detourLat = startLat + sign * offset;
      const detourLng = startLng;
      const parallelLat = detourLat;
      const parallelLng = endLng;
      return [start, [detourLng, detourLat], [parallelLng, parallelLat], end];
    }
  };

  // Enhanced strategy: try multiple parallel routes with different offsets
  const buildMultiRouteCandidate = (offset, sign) => {
    const routes = [];

    // Primary route: start -> offset -> parallel -> end
    routes.push(buildCandidate(offset, sign));

    // Alternative route: start -> offset -> offset2 -> parallel -> end (creates a wider arc)
    const offset2 = offset * 0.7; // Secondary offset
    if (isNorthSouth) {
      const detourLng1 = startLng + sign * offset;
      const detourLat1 = startLat;
      const detourLng2 = detourLng1 + sign * offset2;
      const detourLat2 = startLat + (endLat - startLat) * 0.3; // 30% along route
      const parallelLng = detourLng2;
      const parallelLat = endLat;
      routes.push([
        start,
        [detourLng1, detourLat1],
        [detourLng2, detourLat2],
        [parallelLng, parallelLat],
        end,
      ]);
    } else {
      const detourLat1 = startLat + sign * offset;
      const detourLng1 = startLng;
      const detourLat2 = detourLat1 + sign * offset2;
      const detourLng2 = startLng + (endLng - startLng) * 0.3; // 30% along route
      const parallelLat = detourLat2;
      const parallelLng = endLng;
      routes.push([
        start,
        [detourLng1, detourLat1],
        [detourLng2, detourLat2],
        [parallelLng, parallelLat],
        end,
      ]);
    }

    return routes;
  };

  const computeMinClearanceKm = (poly, pts) => {
    if (!pts || pts.length === 0) return Infinity;
    let minKm = Infinity;

    // Check clearance from every segment to every blocked point
    for (let i = 1; i < poly.length; i++) {
      const [x1, y1] = poly[i - 1];
      const [x2, y2] = poly[i];
      for (const [px, py] of pts) {
        const d = calculateDistanceFromPointToLine(py, px, y1, x1, y2, x2);
        if (d < minKm) minKm = d; // already in km
      }
    }

    // Also check if any waypoint is too close to any blocked point
    for (const [px, py] of pts) {
      for (const [wx, wy] of poly) {
        const directDist = getCachedDistance([wx, wy], [px, py]);
        if (directDist < minKm) minKm = directDist;
      }
    }

    return minKm;
  };

  const polyKm = (poly) => {
    let total = 0;
    for (let i = 1; i < poly.length; i++) {
      total += getCachedDistance(poly[i - 1], poly[i]);
    }
    return total;
  };

  let best = null;
  for (let offset = minOffset; offset <= maxOffset; offset += step) {
    // Try both positive and negative offsets
    const cands = [buildCandidate(offset, +1), buildCandidate(offset, -1)];

    for (const poly of cands) {
      const clearance = computeMinClearanceKm(poly, blockedPoints);
      const total = polyKm(poly);
      console.log(
        "🧪 [DETOUR DEBUG] offset:",
        offset.toFixed(4),
        "clearance:",
        clearance.toFixed(3),
        "km total:",
        total.toFixed(3)
      );

      // Prioritize clearance over distance - safety first
      if (clearance >= minClearKm) {
        if (
          !best ||
          clearance > best.clearance ||
          (clearance === best.clearance && total < best.total)
        ) {
          best = { poly, total, clearance };
        }
      }
    }

    // If we found a good route with sufficient clearance, use it
    if (best && best.clearance >= minClearKm * 1.2) {
      // 20% extra clearance for safety
      console.log("✅ [DETOUR DEBUG] Found safe route with extra clearance");
      break;
    }
  }

  const waypoints = best ? best.poly : buildCandidate(maxOffset, +1);

  // Final validation: ensure no segment comes closer than 100m to any crossing
  const finalValidation = (waypoints) => {
    if (!blockedPoints || blockedPoints.length === 0) return waypoints;

    let validated = [...waypoints];
    let violations = 0;
    const maxViolations = 10;

    for (
      let i = 0;
      i < validated.length - 1 && violations < maxViolations;
      i++
    ) {
      const [x1, y1] = validated[i];
      const [x2, y2] = validated[i + 1];

      for (const [px, py] of blockedPoints) {
        const d = calculateDistanceFromPointToLine(py, px, y1, x1, y2, x2);
        if (d < 0.1) {
          // Less than 100m
          // Insert a waypoint to push the route away
          const midLng = (x1 + x2) / 2;
          const midLat = (y1 + y2) / 2;
          const routeAngle = Math.atan2(y2 - y1, x2 - x1);
          const perp = routeAngle + Math.PI / 2;
          const pushOffset = 0.0008; // ~80-90m push

          const pushLng = midLng + Math.cos(perp) * pushOffset;
          const pushLat = midLat + Math.sin(perp) * pushOffset;

          validated.splice(i + 1, 0, [pushLng, pushLat]);
          violations++;
          break;
        }
      }
    }

    return validated;
  };

  const finalWaypoints = finalValidation(waypoints);
  console.log("🛣️ [DETOUR DEBUG] Final waypoints:", finalWaypoints.length);
  finalWaypoints.forEach((waypoint, index) => {
    const label =
      index === 0
        ? "Start"
        : index === finalWaypoints.length - 1
        ? "End"
        : `Waypoint ${index}`;
    console.log(
      `  ${label}: [${waypoint[0].toFixed(6)}, ${waypoint[1].toFixed(6)}]`
    );
  });

  // Calculate total detour distance
  let totalDetourDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const segmentDistance =
      Math.sqrt(
        Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[1] - prev[1], 2)
      ) * 111000; // Convert to meters
    totalDetourDistance += segmentDistance;
    console.log(
      `📏 [DETOUR DEBUG] Segment ${i - 1}-${i}: ${Math.round(segmentDistance)}m`
    );
  }

  console.log(
    "📏 [DETOUR DEBUG] Total detour distance:",
    Math.round(totalDetourDistance),
    "meters"
  );

  const result = {
    type: "comprehensive-detour",
    waypoints,
    detourReason: "All Ped Crossings Closed - Complete Barrier Detour",
    originalRoute: [start, end],
    detourDistance: totalDetourDistance,
    originalDistance:
      calculateDistance(start[1], start[0], end[1], end[0]) * 1000,
    detourStrategy:
      "Multi-parallel-route with minimum 120m clearance from all crossings",
    safetyFeatures: [
      "Complete barrier around all closed crossings",
      "Minimum 120m clearance from any crossing",
      "Uses major parallel roads for maximum safety",
      "Prevents crossing from any direction",
      "Route cannot enter crossing zones",
    ],
  };

  console.log("✅ [DETOUR DEBUG] Comprehensive detour created successfully");
  console.log(
    "🛡️ [DETOUR DEBUG] Safety features:",
    result.safetyFeatures.length
  );

  return result;
};

// Helper to compute projection parameter t (0..1) of point P onto line AB
const computeProjectionParam = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const lenSq = C * C + D * D;
  if (lenSq === 0) return 0;
  const t = (A * C + B * D) / lenSq;
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
};

// Create a simple right-turn detour: approach crossing, turn right, proceed on parallel road
const createSimpleRightTurnDetour = (
  start,
  end,
  pedCrossing,
  blockedPoints = []
) => {
  console.log("🔄 [DETOUR DEBUG] Creating simple right-turn detour");
  console.log("📍 [DETOUR DEBUG] Start:", start);
  console.log("🎯 [DETOUR DEBUG] End:", end);
  console.log("🚸 [DETOUR DEBUG] Ped Crossing to avoid:", pedCrossing);

  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  const [pcLng, pcLat] = pedCrossing;

  // Calculate route direction
  const routeAngle = Math.atan2(endLat - startLat, endLng - startLng);

  // Find the point where we need to turn right (just before reaching the crossing)
  const t = computeProjectionParam(
    pcLng,
    pcLat,
    startLng,
    startLat,
    endLng,
    endLat
  );

  // Turn right 30m before reaching the crossing
  const turnDistanceMeters = 30;
  const routeLengthUnits = Math.sqrt(
    Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2)
  );
  const routeLengthKm = routeLengthUnits * 111;
  const turnFraction = Math.min(
    0.05,
    turnDistanceMeters / 1000 / Math.max(routeLengthKm, 0.001)
  );

  const tBefore = Math.max(0, t - turnFraction);
  const turnPointLng = startLng + (endLng - startLng) * tBefore;
  const turnPointLat = startLat + (endLat - startLat) * tBefore;

  // Determine which side to turn based on user's position relative to the crossing
  // We want to turn AWAY from the crossing, not toward it

  // Calculate user's position relative to the crossing
  const userToCrossingAngle = Math.atan2(pcLat - startLat, pcLng - startLng);
  const routeToCrossingAngle = Math.atan2(
    pcLat - turnPointLat,
    pcLng - turnPointLng
  );

  // Determine if we should turn left or right to avoid the crossing
  let turnDirection;
  let turnAngle;

  // Calculate the angle difference to determine which side is safer
  const angleDiff = Math.abs(routeToCrossingAngle - routeAngle);

  if (angleDiff < Math.PI / 2) {
    // Route is heading toward crossing - turn AWAY from it
    // Determine which side based on crossing position
    const crossProduct =
      (pcLng - turnPointLng) * Math.cos(routeAngle) -
      (pcLat - turnPointLat) * Math.sin(routeAngle);

    if (crossProduct > 0) {
      // Crossing is to the right of route - turn LEFT to avoid it
      turnDirection = "left";
      turnAngle = routeAngle - Math.PI / 2; // 90 degrees counterclockwise
      console.log(
        "🔄 [DETOUR DEBUG] Crossing on right - turning LEFT to avoid"
      );
    } else {
      // Crossing is to the left of route - turn RIGHT to avoid it
      turnDirection = "right";
      turnAngle = routeAngle + Math.PI / 2; // 90 degrees clockwise
      console.log(
        "🔄 [DETOUR DEBUG] Crossing on left - turning RIGHT to avoid"
      );
    }
  } else {
    // Route is moving away from crossing - use default right turn
    turnDirection = "right";
    turnAngle = routeAngle + Math.PI / 2;
    console.log(
      "🔄 [DETOUR DEBUG] Route moving away from crossing - default RIGHT turn"
    );
  }

  // Turn by 60-80m to get to the parallel road
  const turnDistance = 0.0006; // ~60-70m
  const parallelLng = turnPointLng + Math.cos(turnAngle) * turnDistance;
  const parallelLat = turnPointLat + Math.sin(turnAngle) * turnDistance;

  // Create a more natural detour that follows the street grid
  // Instead of going directly to end, create intermediate waypoints that avoid other crossings

  // Calculate how far we need to go along the parallel road to clear the crossing zone
  const clearDistance = 0.0008; // ~80-90m to ensure we're clear

  // First waypoint: proceed along parallel road
  const parallelLng1 = parallelLng + Math.cos(routeAngle) * clearDistance;
  const parallelLat1 = parallelLat + Math.sin(routeAngle) * clearDistance;

  // Second waypoint: turn back toward the destination (but still on parallel road)
  const returnDistance = 0.0006; // ~60-70m back toward destination
  const returnLng = parallelLng1 + Math.cos(routeAngle) * returnDistance;
  const returnLat = parallelLat1 + Math.sin(routeAngle) * returnDistance;

  // Create waypoints: start -> approach -> turn right -> parallel road -> clear crossing -> return path -> end
  // Create waypoints: start -> approach -> turn right -> parallel road -> clear crossing -> return path -> end
  let waypoints = [
    start,
    [turnPointLng, turnPointLat], // Approach crossing (30m before)
    [parallelLng, parallelLat], // Turn right to parallel road
    [parallelLng1, parallelLat1], // Proceed along parallel road to clear crossing
    [returnLng, returnLat], // Return path toward destination
    end, // Continue to destination
  ];

  // Only validate waypoints if they're dangerously close to crossings (very conservative)
  if (blockedPoints && blockedPoints.length > 0 && waypoints.length < 10) {
    console.log(
      "🔍 [DETOUR DEBUG] Minimal validation - only fixing critical violations"
    );

    let criticalViolations = 0;
    const maxViolations = 1; // Only fix 1 critical violation max

    for (
      let i = 0;
      i < waypoints.length - 1 && criticalViolations < maxViolations;
      i++
    ) {
      const [x1, y1] = waypoints[i];
      const [x2, y2] = waypoints[i + 1];

      for (const [px, py] of blockedPoints) {
        const d = calculateDistanceFromPointToLine(py, px, y1, x1, y2, x2);
        if (d < 0.03) {
          // Only fix if less than 30m from crossing (very conservative)
          console.log(
            `🚨 [DETOUR DEBUG] CRITICAL: Segment ${i}-${
              i + 1
            } dangerously close to crossing (${(d * 1000).toFixed(0)}m)`
          );

          // Push this segment away with a single, large offset
          const midLng = (x1 + x2) / 2;
          const midLat = (y1 + y2) / 2;
          const routeAngle = Math.atan2(y2 - y1, x2 - x1);
          const perp = routeAngle + Math.PI / 2;
          const pushOffset = 0.0015; // ~150-170m push (single large correction)

          const pushLng = midLng + Math.cos(perp) * pushOffset;
          const pushLat = midLat + Math.sin(perp) * pushOffset;

          waypoints.splice(i + 1, 0, [pushLng, pushLat]);
          console.log(
            `✅ [DETOUR DEBUG] Fixed critical violation with single waypoint`
          );
          criticalViolations++;
          break;
        }
      }
    }

    if (criticalViolations === 0) {
      console.log(
        "✅ [DETOUR DEBUG] No critical violations found - keeping route clean"
      );
    }
  }

  console.log(
    `🛣️ [DETOUR DEBUG] ${turnDirection.toUpperCase()}-turn detour waypoints:`,
    waypoints.length
  );
  waypoints.forEach((waypoint, index) => {
    const label =
      index === 0
        ? "Start"
        : index === waypoints.length - 1
        ? "End"
        : `Turn ${index}`;
    console.log(
      `  ${label}: [${waypoint[0].toFixed(6)}, ${waypoint[1].toFixed(6)}]`
    );
  });

  // Calculate total detour distance
  let totalDetourDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const segmentDistance =
      Math.sqrt(
        Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[1] - prev[1], 2)
      ) * 111000;
    totalDetourDistance += segmentDistance;
    console.log(
      `📏 [DETOUR DEBUG] Segment ${i - 1}-${i}: ${Math.round(segmentDistance)}m`
    );
  }

  console.log(
    "📏 [DETOUR DEBUG] Total detour distance:",
    Math.round(totalDetourDistance),
    "meters"
  );

  const result = {
    type: `${turnDirection}-turn-detour`,
    waypoints,
    detourReason: `Ped Crossing Closed - Turn ${
      turnDirection.charAt(0).toUpperCase() + turnDirection.slice(1)
    } to Parallel Road`,
    originalRoute: [start, end],
    detourDistance: totalDetourDistance,
    originalDistance:
      calculateDistance(start[1], start[0], end[1], end[0]) * 1000,
    safetyFeatures: [
      "Approach within 30m of crossing",
      `Turn ${turnDirection} to parallel road (away from crossing)`,
      "Proceed on parallel road to avoid crossing",
      "Dynamic side selection based on crossing position",
      "Simple and direct detour path",
    ],
  };

  console.log("✅ [DETOUR DEBUG] Right-turn detour created successfully");
  return result;
};

// Create detour around specific Ped Crossing that completely avoids the area
const createSpecificPedCrossingDetour = (
  start,
  end,
  pedCrossing,
  blockedPoints = []
) => {
  console.log("🔄 [DETOUR DEBUG] Creating specific Ped Crossing detour");
  console.log("📍 [DETOUR DEBUG] Start:", start);
  console.log("🎯 [DETOUR DEBUG] End:", end);
  console.log("🚸 [DETOUR DEBUG] Ped Crossing to avoid:", pedCrossing);
  console.log("🔄 [DETOUR DEBUG] Function parameters received correctly");

  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  // Ensure pedestrian crossing coordinates are in [lng, lat] format
  const [pcLng, pcLat] =
    Array.isArray(pedCrossing) && pedCrossing.length === 2
      ? pedCrossing
      : [pedCrossing[1], pedCrossing[0]]; // Convert from [lat, lng] to [lng, lat] if needed

  console.log("🔧 [DETOUR DEBUG] Original ped crossing:", pedCrossing);
  console.log("🔧 [DETOUR DEBUG] Converted ped crossing [lng, lat]:", [
    pcLng,
    pcLat,
  ]);

  // Calculate distance from Ped Crossing to the direct route line
  const directRouteDistance = calculateDistanceFromPointToLine(
    pcLat,
    pcLng,
    startLat,
    startLng,
    endLat,
    endLng
  );
  console.log(
    "📏 [DETOUR DEBUG] Ped Crossing distance from direct route:",
    (directRouteDistance * 1000).toFixed(0),
    "meters"
  );

  // If Ped Crossing is within 200m of the direct route, create minimal detour
  const detourThreshold = 0.2; // 0.2 km (200m) — we can get close, just don't cross
  console.log("🚨 [DETOUR DEBUG] Detour threshold:", detourThreshold, "km");

  console.log(
    "🔍 [DETOUR DEBUG] Distance check:",
    directRouteDistance,
    "km <= ",
    detourThreshold,
    "km =",
    directRouteDistance <= detourThreshold
  );
  console.log(
    "🔍 [DETOUR DEBUG] directRouteDistance type:",
    typeof directRouteDistance,
    "value:",
    directRouteDistance
  );
  console.log(
    "🔍 [DETOUR DEBUG] detourThreshold type:",
    typeof detourThreshold,
    "value:",
    detourThreshold
  );

  if (directRouteDistance <= detourThreshold) {
    console.log(
      "✅ [DETOUR DEBUG] Ped Crossing near direct route - creating short-turn detour"
    );
    // Create realistic side street detour: approach crossing, turn right to side street
    const lateralOffset = 0.0004; // ~40-50m to next side street
    const alongOffset = 0.0002; // ~20-25m forward along the side street

    // Find a point very close to the crossing (within 10-15m)
    const t = computeProjectionParam(
      pcLng,
      pcLat,
      startLng,
      startLat,
      endLng,
      endLat
    );
    // Step back ~30m before reaching the crossing so we never enter it from any side
    const backMeters = 30; // meters
    const approxKmPerUnit = 111; // degrees to km simple scale
    const routeLenUnits = Math.sqrt(
      Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2)
    );
    const routeLenKm = routeLenUnits * approxKmPerUnit;
    const backFraction = Math.min(
      0.05,
      backMeters / 1000 / Math.max(routeLenKm, 0.001)
    );
    const tBefore = Math.max(0, t - backFraction);
    const beforeLng = startLng + (endLng - startLng) * tBefore;
    const beforeLat = startLat + (endLat - startLat) * tBefore;

    // Perpendicular shift
    const routeAngle = Math.atan2(endLat - startLat, endLng - startLng);
    const perp = routeAngle + Math.PI / 2;
    // Choose the perpendicular side that maximizes clearance from all blocked crossings
    const candidateShift = (sign) => [
      Math.cos(perp) * lateralOffset * sign,
      Math.sin(perp) * lateralOffset * sign,
    ];
    const measureClearance = (turnLngCand, turnLatCand) => {
      if (!blockedPoints || blockedPoints.length === 0) return Infinity;
      let minKm = Infinity;
      const poly = [start, [turnLngCand, turnLatCand], end];
      for (let i = 1; i < poly.length; i++) {
        const [x1, y1] = poly[i - 1];
        const [x2, y2] = poly[i];
        for (const [px, py] of blockedPoints) {
          const d = calculateDistanceFromPointToLine(py, px, y1, x1, y2, x2);
          if (d < minKm) minKm = d;
        }
      }
      return minKm;
    };

    const [shiftLngPos, shiftLatPos] = candidateShift(+1);
    const [shiftLngNeg, shiftLatNeg] = candidateShift(-1);
    const turnLngPos = startLng + (endLng - startLng) * tBefore + shiftLngPos;
    const turnLatPos = startLat + (endLat - startLat) * tBefore + shiftLatPos;
    const turnLngNeg = startLng + (endLng - startLng) * tBefore + shiftLngNeg;
    const turnLatNeg = startLat + (endLat - startLat) * tBefore + shiftLatNeg;
    const clearancePos = measureClearance(turnLngPos, turnLatPos);
    const clearanceNeg = measureClearance(turnLngNeg, turnLatNeg);
    const usePositive = clearancePos >= clearanceNeg;
    const shiftLng = usePositive ? shiftLngPos : shiftLngNeg;
    const shiftLat = usePositive ? shiftLatPos : shiftLatNeg;

    const turnLng = beforeLng + shiftLng;
    const turnLat = beforeLat + shiftLat;
    const advanceLng = turnLng + Math.cos(routeAngle) * alongOffset;
    const advanceLat = turnLat + Math.sin(routeAngle) * alongOffset;

    // Create minimal detour: start -> near crossing -> right turn -> parallel road -> end
    // Ensure segments also keep distance from every closed crossing by inserting local detours when needed
    const minClearKm = 0.03; // 30m clearance
    const enforceClearanceOnSegments = (pts) => {
      if (!blockedPoints || blockedPoints.length === 0) return pts;
      let updated = [...pts];
      let inserts = 0;
      const maxInserts = 8;
      // Iterate until no violations or cap reached
      outer: while (inserts < maxInserts) {
        for (let i = 0; i < updated.length - 1; i++) {
          const [aLng, aLat] = updated[i];
          const [bLng, bLat] = updated[i + 1];
          for (const [px, py] of blockedPoints) {
            const d = calculateDistanceFromPointToLine(
              py,
              px,
              aLat,
              aLng,
              bLat,
              bLng
            );
            if (d < minClearKm) {
              // Build a tiny local detour around this crossing for this segment
              const tSeg = computeProjectionParam(
                px,
                py,
                aLng,
                aLat,
                bLng,
                bLat
              );
              const backMetersLocal = 25; // 25m before the crossing on this segment
              const segUnits = Math.sqrt(
                Math.pow(bLng - aLng, 2) + Math.pow(bLat - aLat, 2)
              );
              const segKm = segUnits * 111;
              const backFracLocal = Math.min(
                0.08,
                backMetersLocal / 1000 / Math.max(segKm, 0.001)
              );
              const tBeforeLocal = Math.max(0, tSeg - backFracLocal);
              const beforeLngLocal = aLng + (bLng - aLng) * tBeforeLocal;
              const beforeLatLocal = aLat + (bLat - aLat) * tBeforeLocal;

              const ang = Math.atan2(bLat - aLat, bLng - aLng);
              const perpAng = ang + Math.PI / 2;
              const sideOffset = 0.00035; // ~35-40m
              const cand = (sign) => [
                Math.cos(perpAng) * sideOffset * sign,
                Math.sin(perpAng) * sideOffset * sign,
              ];

              const evalClear = (lng, lat) => {
                let minKm = Infinity;
                const lineA = [aLng, aLat];
                const lineB = [bLng, bLat];
                const poly = [lineA, [lng, lat], lineB];
                for (let j = 1; j < poly.length; j++) {
                  const [x1, y1] = poly[j - 1];
                  const [x2, y2] = poly[j];
                  for (const [qx, qy] of blockedPoints) {
                    const dd = calculateDistanceFromPointToLine(
                      qy,
                      qx,
                      y1,
                      x1,
                      y2,
                      x2
                    );
                    if (dd < minKm) minKm = dd;
                  }
                }
                return minKm;
              };

              const [dxPos, dyPos] = cand(+1);
              const [dxNeg, dyNeg] = cand(-1);
              const turnLngPosLocal = beforeLngLocal + dxPos;
              const turnLatPosLocal = beforeLatLocal + dyPos;
              const turnLngNegLocal = beforeLngLocal + dxNeg;
              const turnLatNegLocal = beforeLatLocal + dyNeg;
              const clearPos = evalClear(turnLngPosLocal, turnLatPosLocal);
              const clearNeg = evalClear(turnLngNegLocal, turnLatNegLocal);
              const usePos = clearPos >= clearNeg;
              const insLng = usePos ? turnLngPosLocal : turnLngNegLocal;
              const insLat = usePos ? turnLatPosLocal : turnLatNegLocal;

              updated.splice(
                i + 1,
                0,
                [beforeLngLocal, beforeLatLocal],
                [insLng, insLat]
              );
              inserts += 1;
              continue outer;
            }
          }
        }
        break; // no violations
      }
      return updated;
    };

    let waypoints = [start, [beforeLng, beforeLat], [turnLng, turnLat], end];
    waypoints = enforceClearanceOnSegments(waypoints);

    console.log("🛣️ [DETOUR DEBUG] Final waypoints:", waypoints.length);
    waypoints.forEach((waypoint, index) => {
      const label =
        index === 0
          ? "Start"
          : index === waypoints.length - 1
          ? "End"
          : `Waypoint ${index}`;
      console.log(
        `  ${label}: [${waypoint[0].toFixed(6)}, ${waypoint[1].toFixed(6)}]`
      );
    });

    let totalDetourDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const segmentDistance =
        Math.sqrt(
          Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[1] - prev[1], 2)
        ) * 111000;
      totalDetourDistance += segmentDistance;
      console.log(
        `📏 [DETOUR DEBUG] Segment ${i - 1}-${i}: ${Math.round(
          segmentDistance
        )}m`
      );
    }

    console.log(
      "📏 [DETOUR DEBUG] Total detour distance:",
      Math.round(totalDetourDistance),
      "meters"
    );

    const result = {
      type: "ped-crossing-detour",
      waypoints,
      detourReason: "Ped Crossing Closed - Turn right to side street",
      originalRoute: [start, end],
      detourDistance: totalDetourDistance,
      originalDistance:
        calculateDistance(start[1], start[0], end[1], end[0]) * 1000,
      safetyFeatures: [
        "Approach within 5-10m of crossing",
        "Right turn to side street",
        "Uses parallel side street to avoid crossing",
      ],
    };

    console.log("✅ [DETOUR DEBUG] Ped Crossing detour created successfully");
    console.log("🔄 [DETOUR DEBUG] About to return detour result");
    return result;
  } else {
    // Crossing is far enough from direct route, but since routes are closed,
    // we should still create a minimal detour to be safe
    console.log(
      "❌ [DETOUR DEBUG] Crossing far from route - going to safety detour branch"
    );
    console.log(
      "❌ [DETOUR DEBUG] This should NOT happen if distance <= threshold!"
    );

    // Create a minimal lateral detour even for distant crossings
    const safetyOffset = 0.0003; // ~30-35m lateral shift for safety

    // Find a point along the route to create a small detour
    const routeAngle = Math.atan2(endLat - startLat, endLng - startLng);
    const perp = routeAngle + Math.PI / 2;

    // Create a small detour waypoint
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    const detourLng = midLng + Math.cos(perp) * safetyOffset;
    const detourLat = midLat + Math.sin(perp) * safetyOffset;

    const waypoints = [
      start,
      [detourLng, detourLat], // Small safety detour
      end,
    ];

    console.log("🛣️ [DETOUR DEBUG] Safety detour waypoints:", waypoints.length);

    const result = {
      type: "safety-detour",
      waypoints,
      detourReason: "Routes closed - minimal safety detour",
      originalRoute: [start, end],
      detourDistance: safetyOffset * 111000,
      originalDistance:
        calculateDistance(start[1], start[0], end[1], end[0]) * 1000,
      safetyFeatures: [
        "Routes closed - safety detour created",
        "Minimal lateral shift for safety",
        "Avoids crossing area completely",
      ],
    };

    console.log("✅ [DETOUR DEBUG] Safety detour created successfully");
    console.log("🔄 [DETOUR DEBUG] About to return safety detour result");
    return result;
  }
  console.log(
    "❌ [DETOUR DEBUG] Function ended without returning anything - this should not happen!"
  );
};

// Helper function to calculate distance from a point to a line segment
const calculateDistanceFromPointToLine = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  // Return distance in kilometers
  return Math.sqrt(dx * dx + dy * dy) * 111; // Rough conversion to km
};

// Route selection logic - updated for new data structure with 3 Ped Crossing routes
const getSelectedRoute = (bibNumber) => {
  console.log("🔍 [ROUTE DEBUG] getSelectedRoute called for BIB:", bibNumber);
  const data = getBibData(bibNumber);
  if (!data) {
    console.log("❌ [ROUTE DEBUG] No data found for BIB:", bibNumber);
    return null;
  }
  console.log("✅ [ROUTE DEBUG] Data found for BIB:", bibNumber);

  // Check if any route is currently closed
  const isCurrentlyClosed = isCurrentlyInClosurePeriod(
    data.closureTimeStart,
    data.closureTimeEnd
  );
  console.log("🚫 [ROUTE DEBUG] Is currently closed:", isCurrentlyClosed);

  if (isCurrentlyClosed) {
    console.log(
      "🔄 [ROUTE DEBUG] Routes are currently closed - calculating detour route"
    );
    // Calculate detour route instead of just marking as closed
    const startCoords = convertToMapboxFormat(data.routeStartCoordinates);
    const endCoords = convertToMapboxFormat(data.assemblyCoordinates);
    console.log("🗺️ [ROUTE DEBUG] Start coords for detour:", startCoords);
    console.log("🗺️ [ROUTE DEBUG] End coords for detour:", endCoords);

    // Get all pedestrian crossing coordinates that are closed
    const closedCrossings = [];
    if (data["Ped Crossing 1"]) closedCrossings.push(data["Ped Crossing 1"]);
    if (data["Ped Crossing 2"]) closedCrossings.push(data["Ped Crossing 2"]);
    if (data["Ped Crossing 3"]) closedCrossings.push(data["Ped Crossing 3"]);
    if (data["Ped Crossing 4"]) closedCrossings.push(data["Ped Crossing 4"]);

    console.log(
      "🚸 [ROUTE DEBUG] Closed crossings to avoid:",
      closedCrossings.length
    );

    // Find the CLOSEST crossing to the start point (not just the first one)
    let closestCrossing = null;
    let minDistance = Infinity;

    for (const crossing of closedCrossings) {
      const crossingCoords = convertToMapboxFormat(crossing);
      const distance = getCachedDistance(startCoords, crossingCoords);
      console.log(
        `🚸 [ROUTE DEBUG] Crossing distance from start: ${distance.toFixed(
          3
        )} km`
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestCrossing = crossingCoords;
      }
    }

    console.log(
      "🚸 [ROUTE DEBUG] Closest crossing selected:",
      closestCrossing,
      `(${minDistance.toFixed(3)} km from start)`
    );

    const detourRoute = calculateDetourRoute(
      startCoords,
      endCoords,
      closestCrossing, // Use the CLOSEST crossing
      false, // Not all routes closed, but specific crossing is
      closedCrossings.map((crossing) => convertToMapboxFormat(crossing)) // Pass all crossings for reference
    );
    console.log(
      "✅ [ROUTE DEBUG] Detour route calculated for closed routes:",
      detourRoute
    );
    console.log("🔄 [ROUTE DEBUG] Detour route type:", detourRoute?.type);
    console.log(
      "🔄 [ROUTE DEBUG] Detour route waypoints:",
      detourRoute?.waypoints?.length
    );
    if (detourRoute?.waypoints) {
      console.log("🛣️ [ROUTE DEBUG] Detour waypoints:", detourRoute.waypoints);
    }

    return {
      id: `DETOUR-${bibNumber}`,
      name: "Alternate Route - All Ped Crossings Closed",
      coordinates: detourRoute?.waypoints || null,
      closureTime: "ROUTES CLOSED - Using Detour",
      isClosed: true,
      type: "Detour Route",
      routeIndex: null, // No specific route assignment when closed
      detourInfo: detourRoute,
      originalPedCrossing: null,
    };
  }

  console.log(
    "🔄 [ROUTE DEBUG] Routes are NOT closed - assigning specific route"
  );
  // Route assignment based on BIB number modulo 3
  const routeIndex = parseInt(bibNumber) % 3; // 0, 1, or 2
  console.log("🔢 [ROUTE DEBUG] Route index:", routeIndex);

  let selectedRoute;
  let routeName;

  switch (routeIndex) {
    case 0:
      selectedRoute = data["Ped Crossing 1"];
      routeName = "Ped Crossing 1 Route";
      break;
    case 1:
      selectedRoute = data["Ped Crossing 2"];
      routeName = "Ped Crossing 2 Route";
      break;
    case 2:
      selectedRoute = data["Ped Crossing 3"];
      routeName = "Ped Crossing 3 Route";
      break;
    default:
      selectedRoute = data["Ped Crossing 1"]; // fallback
      routeName = "Ped Crossing 1 Route";
  }
  console.log("✅ [ROUTE DEBUG] Assigned route:", routeName);

  return {
    id: `PC${routeIndex + 1}-${bibNumber}`,
    name: routeName,
    coordinates: convertToMapboxFormat(selectedRoute),
    closureTime: data.closureTimeStart.split(", ")[routeIndex] || "Unknown",
    isClosed: false,
    type: `Ped Crossing ${routeIndex + 1}`,
    routeIndex: routeIndex,
  };
};

const Wayfinder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bibNumber = location.state?.bibNumber;

  const [viewState, setViewState] = useState({
    longitude: 151.2072222,
    latitude: -33.8402778,
    zoom: 15,
  });

  const [userLocation, setUserLocation] = useState([151.2072222, -33.8402778]); // Updated default location - Mapbox uses [lng, lat]
  const [customLocation, setCustomLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [bibData, setBibData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

  const [routeDistance, setRouteDistance] = useState(null);
  const [lastRouteUpdate, setLastRouteUpdate] = useState(0);
  const [routeStartLocation, setRouteStartLocation] = useState(null);
  const [routeEndLocation, setRouteEndLocation] = useState(null);
  const [currentRouteLeg, setCurrentRouteLeg] = useState(null); // 'to-route-start' or 'to-assembly'
  const [showRouteSwitchNotification, setShowRouteSwitchNotification] =
    useState(false);
  const [showDebugRoute, setShowDebugRoute] = useState(false); // Debug: show original route from start to assembly

  // Collapsible sections state
  const [isRouteStatusCollapsed, setIsRouteStatusCollapsed] = useState(true);
  const [isStartingPointCollapsed, setIsStartingPointCollapsed] =
    useState(true);

  useEffect(() => {
    if (bibNumber) {
      console.log("🔍 [ROUTE DEBUG] useEffect triggered for BIB:", bibNumber);
      const data = getBibData(bibNumber);
      const route = getSelectedRoute(bibNumber);
      console.log("✅ [ROUTE DEBUG] BIB data retrieved:", data ? "Yes" : "No");
      console.log("✅ [ROUTE DEBUG] Route selected:", route ? "Yes" : "No");
      if (route) {
        console.log("🔄 [ROUTE DEBUG] Route type:", route.type);
        console.log("🚫 [ROUTE DEBUG] Route is closed:", route.isClosed);
        console.log(
          "🛣️ [ROUTE DEBUG] Route has detour info:",
          route.detourInfo ? "Yes" : "No"
        );
        if (route.detourInfo) {
          console.log("🔄 [ROUTE DEBUG] Detour type:", route.detourInfo.type);
          console.log(
            "🔄 [ROUTE DEBUG] Detour waypoints:",
            route.detourInfo.waypoints?.length
          );
        }
      }
      setBibData(data);
      setSelectedRoute(route);
    }
  }, [bibNumber]);

  useEffect(() => {
    if (useCurrentLocation) {
      console.log("Checkbox checked - getting current location");
      getCurrentLocation();
    } else {
      console.log("Checkbox unchecked - using default simulated location");
      // Always reset to simulated location when not using current location
      setUserLocation([151.2072222, -33.8402778]);
      // Reset loading state when unchecking current location
      setIsLoadingLocation(false);
      // Center map on default location
      setViewState((prev) => ({
        ...prev,
        longitude: 151.2072222,
        latitude: -33.8402778,
      }));
    }
  }, [useCurrentLocation]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(
            "Got current location:",
            position.coords.latitude,
            position.coords.longitude
          );
          const newLocation = [
            position.coords.longitude, // Mapbox uses [lng, lat]
            position.coords.latitude,
          ];
          setUserLocation(newLocation);
          setIsLoadingLocation(false);

          // Center map on current location
          setViewState((prev) => ({
            ...prev,
            longitude: newLocation[0],
            latitude: newLocation[1],
          }));
          console.log("Map centered on current location");
        },
        (error) => {
          console.error("Error getting location:", error);
          console.log("Falling back to default simulated location");
          // Reset to simulated location if geolocation fails
          setUserLocation([151.2072222, -33.8402778]);
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.log(
        "Geolocation not supported, using default simulated location"
      );
      setUserLocation([151.2072222, -33.8402778]);
      setIsLoadingLocation(false);
    }
  };

  // Calculate distance between two coordinates (using cached version)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return getCachedDistance([lon1, lat1], [lon2, lat2]);
  };

  // Helper function to calculate distance from a point to a line segment
  const calculateDistanceFromPointToLine = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    // Return distance in kilometers
    return Math.sqrt(dx * dx + dy * dy) * 111; // Rough conversion to km
  };

  const handleConfirm = () => {
    if (!bibData || !selectedRoute) {
      alert("BIB data not found. Please go back and try again.");
      return;
    }

    // If using custom location input (optional), log it
    if (!useCurrentLocation && customLocation.trim()) {
      console.log(
        "Using custom location input:",
        customLocation,
        "(with default coordinates)"
      );
    } else if (!useCurrentLocation) {
      console.log("Using default simulated location near route start");
    }

    setLocationConfirmed(true);
  };

  // Track user location to detect arrival at assembly point
  useEffect(() => {
    if (bibData && userLocation && !hasArrived) {
      const distanceToAssembly = calculateDistance(
        userLocation[1], // lat
        userLocation[0], // lng
        bibData.assemblyCoordinates[1], // lat
        bibData.assemblyCoordinates[0] // lng
      );

      // If user is within 100 meters (0.1 km) of assembly point, mark as arrived
      if (distanceToAssembly <= 0.1) {
        console.log("🎯 [ARRIVAL] User has arrived at assembly point!");
        setHasArrived(true);
      }
    }
  }, [userLocation, bibData, hasArrived]);

  // Track route changes to show notification when switching from start point to assembly
  useEffect(() => {
    if (currentRouteLeg === "to-assembly" && showDirections) {
      // Check if this is a route switch (user was previously heading to start point)
      const wasHeadingToStart =
        sessionStorage.getItem("wasHeadingToStart") === "true";

      if (wasHeadingToStart) {
        console.log(
          "🔄 [ROUTE SWITCH] User reached start point, now heading to assembly"
        );
        setShowRouteSwitchNotification(true);

        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowRouteSwitchNotification(false);
        }, 5000);

        // Clear the flag
        sessionStorage.removeItem("wasHeadingToStart");
      }
    } else if (currentRouteLeg === "to-route-start") {
      // User is heading to start point, set flag
      sessionStorage.setItem("wasHeadingToStart", "true");
    }
  }, [currentRouteLeg, showDirections]);

  const handleArrivalDone = () => {
    setHasArrived(false);
  };

  // New function to handle smart routing based on user distance from assembly
  const handleSmartRouting = () => {
    console.log("🧠 [ROUTING DEBUG] handleSmartRouting called");
    if (!bibData || !userLocation) {
      console.log("❌ [ROUTING DEBUG] Missing bibData or userLocation");
      return;
    }
    console.log("✅ [ROUTING DEBUG] bibData and userLocation available");

    // Check if routes are currently closed
    if (selectedRoute?.isClosed) {
      console.log(
        "🚫 [ROUTING DEBUG] Routes are currently closed - providing detour route"
      );
      console.log("🔄 [ROUTING DEBUG] Selected route details:", selectedRoute);

      if (
        selectedRoute.detourInfo &&
        (selectedRoute.detourInfo.type === "detour" ||
          selectedRoute.detourInfo.type === "comprehensive-detour" ||
          selectedRoute.detourInfo.type === "ped-crossing-detour" ||
          selectedRoute.detourInfo.type === "safety-detour")
      ) {
        console.log("🛣️ [ROUTING DEBUG] Using detour route with waypoints");
        console.log(
          "🔄 [ROUTING DEBUG] Detour type:",
          selectedRoute.detourInfo.type
        );
        // Use detour route with waypoints
        const detourWaypoints = selectedRoute.detourInfo.waypoints;
        if (detourWaypoints && detourWaypoints.length >= 2) {
          // For detour routes, we'll show the route from user to assembly via detour
          console.log(
            "🔄 [ROUTING DEBUG] Setting route to assembly via detour"
          );
          console.log("📍 [ROUTING DEBUG] Route start (user):", userLocation);
          console.log(
            "🎯 [ROUTING DEBUG] Route end (last waypoint):",
            detourWaypoints[detourWaypoints.length - 1]
          );

          setRouteStartLocation(userLocation);
          setRouteEndLocation(detourWaypoints[detourWaypoints.length - 1]);
          setCurrentRouteLeg("to-assembly-detour");
          setLastRouteUpdate(Date.now());

          console.log(
            "✅ [ROUTING DEBUG] Detour route set successfully - EXITING to prevent override"
          );
          return; // Exit here to prevent any other routing logic from overriding
        }
      }

      console.log(
        "⚠️ [ROUTING DEBUG] No detour waypoints found - using fallback safety route"
      );
      // Fallback: direct route to assembly avoiding Ped Crossings
      setRouteStartLocation(userLocation);
      setRouteEndLocation(convertToMapboxFormat(bibData.assemblyCoordinates));
      setCurrentRouteLeg("to-assembly-safety");
      setLastRouteUpdate(Date.now());

      console.log(
        "✅ [ROUTING DEBUG] Fallback safety route set - EXITING to prevent override"
      );
      return; // Exit here to prevent any other routing logic from overriding
    }

    console.log(
      "✅ [ROUTING DEBUG] Routes are NOT closed - proceeding with normal routing"
    );
    // Get converted coordinates for Mapbox format
    const assemblyCoords = convertToMapboxFormat(bibData.assemblyCoordinates);
    const routeStartCoords = convertToMapboxFormat(
      bibData.routeStartCoordinates
    );

    if (!assemblyCoords || !routeStartCoords) {
      console.error("Invalid coordinates in bibData");
      return;
    }

    console.log("🗺️ [ROUTING DEBUG] Assembly coordinates:", assemblyCoords);
    console.log(
      "🗺️ [ROUTING DEBUG] Route start coordinates:",
      routeStartCoords
    );

    // Calculate distance from user to assembly coordinates
    const distanceToAssembly = calculateDistance(
      userLocation[1], // lat
      userLocation[0], // lng
      assemblyCoords[1], // assembly lat
      assemblyCoords[0] // assembly lng
    );

    // Calculate distance from user to route start coordinates
    const distanceToRouteStart = calculateDistance(
      userLocation[1], // lat
      userLocation[0], // lng
      routeStartCoords[1], // route start lat
      routeStartCoords[0] // route start lng
    );

    console.log(
      "📏 [ROUTING DEBUG] Distance to assembly:",
      distanceToAssembly.toFixed(3),
      "km"
    );
    console.log(
      "📏 [ROUTING DEBUG] Distance to route start:",
      distanceToRouteStart.toFixed(3),
      "km"
    );

    // Determine routing strategy based on user location
    if (distanceToAssembly <= 0.4) {
      // User is within 400m of assembly - route directly to assembly
      console.log(
        "✅ [ROUTING DEBUG] User within 400m of assembly - routing directly to assembly"
      );
      setRouteStartLocation(userLocation);
      setRouteEndLocation(assemblyCoords);
      setCurrentRouteLeg("to-assembly");
      setLastRouteUpdate(Date.now());
    } else if (distanceToRouteStart <= 0.05) {
      // User is at starting point (within 50m) - route directly to assembly
      console.log(
        "✅ [ROUTING DEBUG] User at starting point - routing directly to assembly"
      );
      setRouteStartLocation(userLocation);
      setRouteEndLocation(assemblyCoords);
      setCurrentRouteLeg("to-assembly");
      setLastRouteUpdate(Date.now());
    } else {
      // User is far from both assembly and starting point - route to starting point first
      console.log(
        "⚠️ [ROUTING DEBUG] User far from both - routing to starting point first"
      );
      setRouteStartLocation(userLocation);
      setRouteEndLocation(routeStartCoords);
      setCurrentRouteLeg("to-route-start");
      setLastRouteUpdate(Date.now());
    }
  };

  const handleDirectionsClick = () => {
    const newShowDirections = !showDirections;
    setShowDirections(newShowDirections);

    if (newShowDirections) {
      // Get converted coordinates for Mapbox format
      const assemblyCoords = convertToMapboxFormat(bibData.assemblyCoordinates);

      if (!assemblyCoords) {
        console.error("Invalid assembly coordinates in bibData");
        return;
      }

      // When showing directions, center map to show both points
      const centerLng = (userLocation[0] + assemblyCoords[0]) / 2;
      const centerLat = (userLocation[1] + assemblyCoords[1]) / 2;

      // Calculate bounds to ensure both points are visible
      const lngDiff = Math.abs(userLocation[0] - assemblyCoords[0]);
      const latDiff = Math.abs(userLocation[1] - assemblyCoords[1]);
      const maxDiff = Math.max(lngDiff, latDiff);

      // Set zoom level based on distance between points
      let zoom = 15; // default zoom
      if (maxDiff > 0.01) zoom = 13; // if points are far apart
      if (maxDiff > 0.05) zoom = 11; // if points are very far apart

      setViewState((prev) => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom: zoom,
      }));

      // Use smart routing logic instead of simple route
      handleSmartRouting();

      // For simulation: Check routing logic based on distance to assembly
      // BUT ONLY if routes are NOT closed (to avoid overriding detour routes)
      if (bibData && !selectedRoute?.isClosed) {
        console.log(
          "🔄 [ROUTING DEBUG] Routes not closed - applying distance-based routing"
        );

        const distanceToAssembly = calculateDistance(
          userLocation[1], // lat
          userLocation[0], // lng
          assemblyCoords[1], // assembly lat
          assemblyCoords[0] // assembly lng
        );

        const distanceToRouteStart = calculateDistance(
          userLocation[1], // lat
          userLocation[0], // lng
          convertToMapboxFormat(bibData.routeStartCoordinates)[1], // route start lat
          convertToMapboxFormat(bibData.routeStartCoordinates)[0] // route start lng
        );

        // Check if user is within 400m of assembly
        if (distanceToAssembly <= 0.4) {
          // Route should be: User → Assembly (direct route)
          console.log(
            "✅ [ROUTING DEBUG] User within 400m of assembly - direct route"
          );
          setRouteStartLocation(userLocation);
          setRouteEndLocation(assemblyCoords);
          setCurrentRouteLeg("to-assembly");
          setLastRouteUpdate(Date.now());

          // Cache verification - this route should be cached
          console.log(
            "Route cache key:",
            `${userLocation[0]},${userLocation[1]}-${assemblyCoords[0]},${assemblyCoords[1]}`
          );
        } else if (distanceToRouteStart <= 0.05) {
          // If user is within 50m of route start, they're essentially at the starting point
          console.log(
            `✅ [ROUTING DEBUG] User at starting point (${distanceToRouteStart.toFixed(
              3
            )} km away) - showing route directly to assembly`
          );
          setRouteStartLocation(userLocation);
          setRouteEndLocation(assemblyCoords);
          setCurrentRouteLeg("to-assembly");
          setLastRouteUpdate(Date.now());
        } else {
          // Route should be: User → Route Start
          console.log(
            `⚠️ [ROUTING DEBUG] User needs to go to starting point first (${distanceToRouteStart.toFixed(
              3
            )} km away)`
          );
          setRouteStartLocation(userLocation);
          setRouteEndLocation(
            convertToMapboxFormat(bibData.routeStartCoordinates)
          );
          setCurrentRouteLeg("to-route-start");
          setLastRouteUpdate(Date.now());
        }
      } else if (bibData && selectedRoute?.isClosed) {
        console.log(
          "🚫 [ROUTING DEBUG] Routes are closed - distance-based routing SKIPPED to preserve detour routes"
        );
      }

      console.log("Map centered to show both start and end points");
    } else {
      // Reset route distance when hiding directions
      setRouteDistance(null);
      setRouteStartLocation(null);
      setRouteEndLocation(null);
      setCurrentRouteLeg(null);
    }
  };

  const handleLocationTypeChange = (e) => {
    setCustomLocation(e.target.value);
  };

  // Geocoding function to search for locations
  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchingLocation(true);
    try {
      // Using OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=au`
      );
      const data = await response.json();

      const results = data.map((item) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
      }));

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle location search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customLocation.trim() && !useCurrentLocation) {
        searchLocation(customLocation);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [customLocation, useCurrentLocation]);

  // Handle selecting a search result
  const handleLocationSelect = (result) => {
    console.log(
      "Selected location:",
      result.display_name,
      "at",
      result.lat,
      result.lon
    );
    setUserLocation([result.lon, result.lat]); // Mapbox uses [lng, lat]
    setCustomLocation(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);

    // Center map on selected location
    setViewState((prev) => ({
      ...prev,
      longitude: result.lon,
      latitude: result.lat,
    }));
    console.log("Map centered on selected location");
  };

  if (!bibNumber || !bibData) {
    return (
      <div className="wayfinder-screen">
        <Header />
        <div className="error-container">
          <h2>No BIB Number Found</h2>
          <p>Please go back and enter your BIB number.</p>
          <button
            onClick={() => navigate("/find-my-route")}
            className="go-back-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wayfinder-screen">
      <Header />

      {/* Map Container */}
      <div className="map-container">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          style={{ height: "100%", width: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        >
          {/* User Location Marker */}
          <Marker
            longitude={userLocation[0]}
            latitude={userLocation[1]}
            anchor="bottom"
          >
            <div className="current-location-marker">
              <div className="current-location-dot"></div>
              <div className="current-location-pulse"></div>
            </div>
          </Marker>

          {/* Route Start Point Marker - show after location confirmation */}
          {bibData &&
            locationConfirmed &&
            (() => {
              const routeStartCoords = convertToMapboxFormat(
                bibData.routeStartCoordinates
              );
              if (!routeStartCoords) return null;

              return (
                <Marker
                  longitude={routeStartCoords[0]}
                  latitude={routeStartCoords[1]}
                  anchor="bottom"
                >
                  <div className="route-start-marker">
                    <div className="route-start-icon"></div>
                  </div>
                  {/* <Popup
                    anchor="top"
                    longitude={routeStartCoords[0]}
                    latitude={routeStartCoords[1]}
                  >
                    <div>
                      <strong>Route Start Point</strong>
                      <br />
                      {bibData.startingPoint}
                      <br />
                      Route: {selectedRoute?.name}
                    </div>
                  </Popup> */}
                </Marker>
              );
            })()}

          {/* Assembly Point Marker - show after location confirmation */}
          {bibData &&
            locationConfirmed &&
            (() => {
              const assemblyCoords = convertToMapboxFormat(
                bibData.assemblyCoordinates
              );
              if (!assemblyCoords) return null;

              return (
                <Marker
                  longitude={assemblyCoords[0]}
                  latitude={assemblyCoords[1]}
                  anchor="bottom"
                >
                  <div className="assembly-point-marker">
                    <div className="assembly-point-icon"></div>
                  </div>
                  {/* <Popup
                    anchor="top"
                    longitude={assemblyCoords[0]}
                    latitude={assemblyCoords[1]}
                  >
                    <div>
                      <strong>{bibData.assemblyPoint}</strong>
                      <br />
                      Route: {selectedRoute?.name}
                    </div>
                  </Popup> */}
                </Marker>
              );
            })()}

          {/* Route Control - show path only after directions button clicked */}
          {bibData &&
            locationConfirmed &&
            showDirections &&
            routeStartLocation &&
            routeEndLocation && (
              <RouteSource
                sourceId="main-route"
                start={routeStartLocation}
                end={routeEndLocation}
                // Always use API to snap routes to real roads, even for detours
                disableApi={false}
                waypoints={
                  selectedRoute?.isClosed &&
                  selectedRoute?.detourInfo?.waypoints
                    ? selectedRoute.detourInfo.waypoints
                    : undefined
                }
                onRouteFound={(routeData) => {
                  console.log("Route found:", routeData);
                  if (routeData && routeData.distance) {
                    setRouteDistance(routeData.distance);
                  }
                }}
              />
            )}
        </Map>
      </div>

      {/* Conditional Panel Rendering */}
      {!locationConfirmed ? (
        /* Location Confirmation Panel */
        <div className="location-panel">
          <h2 className="panel-title">Confirm Your Location</h2>

          <div className="location-options">
            <div className="location-option">
              <div className="location-option-content">
                <div className="location-icon">
                  <i className="fas fa-location-dot"></i>
                </div>
                <span className="location-text">Current Location</span>
              </div>
              <input
                type="checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
                className="location-checkbox"
              />
            </div>

            <div className="custom-location-input">
              <div className="search-icon">
                <i className="fas fa-search"></i>
              </div>
              <input
                type="text"
                placeholder="Search for your location..."
                value={customLocation}
                onChange={handleLocationTypeChange}
                className="location-input"
                disabled={useCurrentLocation}
              />
              {isSearchingLocation && (
                <div className="search-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="search-result-item"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <div className="result-details">
                        <div className="result-name">{result.display_name}</div>
                        <div className="result-type">{result.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={useCurrentLocation && isLoadingLocation}
          >
            {isLoadingLocation ? "GETTING LOCATION..." : "CONFIRM"}
          </button>
        </div>
      ) : (
        /* Assembly Point Information Panel */
        <div className="assembly-info-panel">
          <div className="assembly-header">
            <button
              className="close-button"
              onClick={() => setLocationConfirmed(false)}
            >
              ×
            </button>
            <div className="assembly-title">
              <i className="fas fa-location-dot assembly-icon"></i>
              <h2>{bibData.assemblyPoint}</h2>
            </div>
          </div>

          {/* Route Status Information - Only show when heading to assembly */}
          {selectedRoute &&
            showDirections &&
            currentRouteLeg &&
            currentRouteLeg !== "to-route-start" &&
            (!selectedRoute.detourInfo ||
              selectedRoute.detourInfo.type !== "detour") && (
              <div className="route-status-info">
                <div
                  className="section-header"
                  onClick={() =>
                    setIsRouteStatusCollapsed(!isRouteStatusCollapsed)
                  }
                >
                  <span>Route Information</span>
                  <i
                    className={`fas fa-chevron-${
                      isRouteStatusCollapsed ? "down" : "up"
                    }`}
                  ></i>
                </div>

                {!isRouteStatusCollapsed && (
                  <>
                    {selectedRoute.isClosed ? (
                      <div className="route-closed-warning">
                        <span>
                          <i className="fas fa-exclamation-triangle"></i> ALL
                          ROUTES CLOSED - Using Alternate Route
                        </span>
                        <div className="closure-times">
                          Closure Times: {bibData.closureTimeStart} -{" "}
                          {bibData.closureTimeEnd}
                        </div>
                        {selectedRoute.detourInfo &&
                          selectedRoute.detourInfo.type === "detour" && (
                            <div className="detour-info">
                              <div className="detour-route">
                                <i className="fas fa-route"></i>
                                <span>Detour Route Active</span>
                              </div>
                              <div className="detour-details">
                                <span>
                                  Reason:{" "}
                                  {selectedRoute.detourInfo.detourReason}
                                </span>
                                <span>Type: Multi-waypoint detour</span>
                                <span>
                                  Waypoints:{" "}
                                  {selectedRoute.detourInfo.waypoints.length}
                                </span>
                              </div>
                              <div className="detour-warning">
                                <i className="fas fa-info-circle"></i>
                                <span>
                                  This route avoids closed Ped Crossing areas
                                </span>
                              </div>
                              {selectedRoute.detourInfo.safetyFeatures && (
                                <div className="safety-features">
                                  <i className="fas fa-shield-alt"></i>
                                  <div className="safety-list">
                                    {selectedRoute.detourInfo.safetyFeatures.map(
                                      (feature, index) => (
                                        <span
                                          key={index}
                                          className="safety-item"
                                        >
                                          • {feature}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        {/* {selectedRoute.detourInfo &&
                          selectedRoute.detourInfo.type ===
                            "comprehensive-detour" && (
                            <div className="detour-info comprehensive">
                              <div className="detour-route">
                                <i className="fas fa-road"></i>
                                <span>Alternative Road Route Active</span>
                              </div>
                              <div className="detour-details">
                                <span>
                                  Reason:{" "}
                                  {selectedRoute.detourInfo.detourReason}
                                </span>
                                <span>
                                  Strategy:{" "}
                                  {selectedRoute.detourInfo.detourStrategy}
                                </span>
                                <span>
                                  Waypoints:{" "}
                                  {selectedRoute.detourInfo.waypoints.length}
                                </span>
                              </div>
                              <div className="detour-warning">
                                <i className="fas fa-shield-alt"></i>
                                <span>
                                  Route uses alternative roads to avoid ALL Ped
                                  Crossings
                                </span>
                              </div>
                              {selectedRoute.detourInfo.safetyFeatures && (
                                <div className="safety-features">
                                  <i className="fas fa-check-circle"></i>
                                  <div className="safety-list">
                                    {selectedRoute.detourInfo.safetyFeatures.map(
                                      (feature, index) => (
                                        <span
                                          key={index}
                                          className="safety-item"
                                        >
                                          • {feature}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )} */}
                      </div>
                    ) : (
                      <div className="route-assignment">
                        <i className="fas fa-route"></i>
                        <span>Assigned Route: {selectedRoute.name}</span>
                        <div className="route-details">
                          <span>Type: {selectedRoute.type}</span>
                          <span>Closure: {selectedRoute.closureTime}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          <div className="assembly-details">
            {/* Current Destination Indicator */}
            {showDirections && currentRouteLeg && (
              <div className="destination-indicator">
                <i
                  className={`fas ${
                    currentRouteLeg === "to-route-start"
                      ? "fa-map-marker-alt"
                      : currentRouteLeg === "to-assembly-safety"
                      ? "fa-route"
                      : currentRouteLeg === "to-assembly-detour"
                      ? "fa-route"
                      : "fa-flag-checkered"
                  }`}
                ></i>
                <span>
                  {currentRouteLeg === "to-route-start"
                    ? `Heading to: ${bibData.startingPoint}`
                    : currentRouteLeg === "to-assembly-safety"
                    ? `Heading to: ${bibData.assemblyPoint} (Avoid Ped Crossings)`
                    : currentRouteLeg === "to-assembly-detour"
                    ? `Heading to: ${bibData.assemblyPoint} (Avoiding Closed Areas)`
                    : `Heading to: ${bibData.assemblyPoint}`}
                </span>
              </div>
            )}

            <div className="distance-info">
              {selectedRoute?.isClosed ? null : showDirections &&
                currentRouteLeg ? (
                <>
                  {currentRouteLeg === "to-route-start" ? (
                    <>
                      Distance to Starting Point:{" "}
                      {(() => {
                        const distanceToStart = calculateDistance(
                          userLocation[1], // lat
                          userLocation[0], // lng
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[1], // route start lat
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[0] // route start lng
                        );
                        return distanceToStart.toFixed(1);
                      })()}{" "}
                      km (~
                      {(() => {
                        const distanceToStart = calculateDistance(
                          userLocation[1], // lat
                          userLocation[0], // lng
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[1], // route start lat
                          convertToMapboxFormat(
                            bibData.routeStartCoordinates
                          )[0] // route start lng
                        );
                        return Math.round(distanceToStart * 12);
                      })()}{" "}
                      min walk)
                    </>
                  ) : (
                    <>
                      Distance to Assembly:{" "}
                      {(() => {
                        // Show current route distance (updates as user moves)
                        const currentDistance =
                          routeDistance ||
                          calculateDistance(
                            userLocation[1], // lat
                            userLocation[0], // lng
                            bibData.assemblyCoordinates[1], // lat
                            bibData.assemblyCoordinates[0] // lng
                          );
                        return currentDistance.toFixed(1);
                      })()}{" "}
                      km (~
                      {(() => {
                        // Show current route time
                        const currentDistance =
                          routeDistance ||
                          calculateDistance(
                            userLocation[1], // lat
                            userLocation[0], // lng
                            bibData.assemblyCoordinates[1], // lat
                            bibData.assemblyCoordinates[0] // lng
                          );
                        return Math.round(currentDistance * 12);
                      })()}{" "}
                      min walk)
                    </>
                  )}
                </>
              ) : (
                <>
                  Distance to Assembly:{" "}
                  {(() => {
                    // Show current route distance (updates as user moves)
                    const currentDistance =
                      routeDistance ||
                      calculateDistance(
                        userLocation[1], // lat
                        userLocation[0], // lng
                        bibData.assemblyCoordinates[1], // lat
                        bibData.assemblyCoordinates[0] // lng
                      );
                    return currentDistance.toFixed(1);
                  })()}{" "}
                  km (~
                  {(() => {
                    // Show current route time
                    const currentDistance =
                      routeDistance ||
                      calculateDistance(
                        userLocation[1], // lat
                        userLocation[0], // lng
                        bibData.assemblyCoordinates[1], // lat
                        bibData.assemblyCoordinates[0] // lng
                      );
                    return Math.round(currentDistance * 12);
                  })()}{" "}
                  min walk)
                </>
              )}
            </div>
            {/* {showDirections && (
              <div className="route-status">
                <i className="fas fa-route"></i>
                Route displayed on map
              </div>
            )} */}
          </div>

          <div className="assembly-actions">
            <button
              className={`direction-button ${showDirections ? "active" : ""}`}
              onClick={handleDirectionsClick}
              disabled={selectedRoute?.isClosed && !selectedRoute?.detourInfo}
              title={
                selectedRoute?.isClosed && !selectedRoute?.detourInfo
                  ? "Routes are currently closed"
                  : selectedRoute?.isClosed && selectedRoute?.detourInfo
                  ? "Show detour route directions"
                  : "Show route directions"
              }
            >
              <i
                className={`fas ${
                  showDirections ? "fa-eye-slash" : "fa-directions"
                }`}
              ></i>
              {selectedRoute?.isClosed && !selectedRoute?.detourInfo
                ? "ROUTES CLOSED"
                : selectedRoute?.isClosed && selectedRoute?.detourInfo
                ? "DIRECTION"
                : showDirections
                ? "HIDE ROUTE"
                : "DIRECTION"}
            </button>
            <button
              className="start-button"
              onClick={() => setHasArrived(true)}
            >
              <i className="fas fa-play"></i>
              START
            </button>
          </div>
        </div>
      )}

      {/* Route Switch Notification */}
      {showRouteSwitchNotification && (
        <div className="route-switch-notification">
          <div className="notification-content">
            <i className="fas fa-route"></i>
            <span>Route updated! Now heading to assembly point.</span>
          </div>
        </div>
      )}

      {/* Arrival Confirmation Modal */}
      {hasArrived && (
        <div className="arrival-overlay">
          <div className="arrival-modal">
            <div className="arrival-header">
              <div className="arrival-icon">
                <i className="fas fa-stopwatch"></i>
              </div>
              <h2 className="arrival-title">Arrival & Start Time Reminder</h2>
            </div>

            <div className="arrival-content">
              <div className="arrival-timing">
                <p className="arrival-time">
                  Please arrive by <strong>{bibData["ARRIVAL Time"]}</strong>.
                </p>
                <p className="start-time">
                  Your Start Chute Time is at{" "}
                  <strong>{bibData["ENTRY CHUTE TIME"]}</strong>.
                </p>
                <p className="arrival-message">Be ready and on time!</p>
              </div>
            </div>

            <button className="arrival-done-button" onClick={handleArrivalDone}>
              <i className="fas fa-check"></i>
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wayfinder;
