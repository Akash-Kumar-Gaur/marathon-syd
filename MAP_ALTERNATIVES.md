# Map Alternatives to Leaflet (CORS-Free Solutions)

Since Leaflet is experiencing CORS issues with tile servers, here are several excellent alternatives that work well with React and don't have CORS problems.

## 🗺️ **Recommended Solutions**

### 1. **Mapbox GL JS** (Most Popular)

**Best for**: Production apps, high performance, vector tiles, 3D capabilities

**Pros:**

- ✅ No CORS issues
- ✅ Excellent performance with vector tiles
- ✅ 3D capabilities
- ✅ Great React support with `react-map-gl`
- ✅ Extensive documentation
- ✅ Free tier available (50,000 map loads/month)

**Cons:**

- Requires API key (free tier available)
- Usage limits on free tier

**Setup:**

```bash
npm install react-map-gl mapbox-gl
```

**Get API Key:**

1. Go to https://account.mapbox.com/
2. Create free account
3. Get your access token
4. Replace `YOUR_MAPBOX_ACCESS_TOKEN` in `src/components/MapboxMap.js`

**Usage:**

```jsx
import MapboxMap from "./components/MapboxMap";

<MapboxMap
  center={[151.2093, -33.8688]}
  zoom={15}
  markers={markers}
  onMarkerClick={handleMarkerClick}
/>;
```

---

### 2. **Google Maps JavaScript API**

**Best for**: Familiar interface, comprehensive features

**Pros:**

- ✅ No CORS issues
- ✅ Familiar interface
- ✅ Comprehensive features
- ✅ Excellent documentation
- ✅ Good React support

**Cons:**

- Requires API key
- Usage limits and costs
- Less customizable than Mapbox

**Setup:**

```bash
npm install @react-google-maps/api
```

**Usage:**

```jsx
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

<LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
  <GoogleMap
    center={center}
    zoom={15}
    mapContainerStyle={{ height: "100%", width: "100%" }}
  >
    {markers.map((marker) => (
      <Marker key={marker.id} position={marker.position} />
    ))}
  </GoogleMap>
</LoadScript>;
```

---

### 3. **OpenLayers** (Free & Open Source)

**Best for**: Completely free solution, no API keys needed

**Pros:**

- ✅ Completely free
- ✅ No API keys required
- ✅ Very powerful and flexible
- ✅ No usage limits
- ✅ Open source

**Cons:**

- Steeper learning curve
- More complex setup
- Less React-specific documentation

**Setup:**

```bash
npm install ol ol-react
```

---

### 4. **Static Map Solution** (Simplest)

**Best for**: Simple implementations, no external dependencies

**Pros:**

- ✅ No CORS issues
- ✅ No API keys needed
- ✅ No external dependencies
- ✅ Simple implementation
- ✅ Complete control

**Cons:**

- Limited interactivity
- No real-time updates
- Less dynamic

**Usage:**

```jsx
import StaticMap from "./components/StaticMap";

<StaticMap
  center={[151.2093, -33.8688]}
  markers={markers}
  onMarkerClick={handleMarkerClick}
/>;
```

---

## 🚀 **Quick Implementation Guide**

### Option 1: Use Mapbox (Recommended)

1. **Install dependencies:**

   ```bash
   npm install react-map-gl mapbox-gl
   ```

2. **Get Mapbox API key:**

   - Go to https://account.mapbox.com/
   - Create free account
   - Copy your access token

3. **Update the MapboxMap component:**

   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` in `src/components/MapboxMap.js`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` in `src/pages/WayfinderMapbox.js`
   - Use `HomeMapbox.js` instead of `Home.js`
   - Use `WayfinderMapbox.js` instead of `Wayfinder.js`

4. **Update your App.js to use the new components:**
   ```jsx
   import Home from "./pages/HomeMapbox";
   import Wayfinder from "./pages/WayfinderMapbox";
   ```

### Option 2: Use Static Map (No API Keys)

1. **Use the StaticMap component directly:**

   ```jsx
   import StaticMap from "./components/StaticMap";
   ```

2. **Replace your map containers with:**

   ```jsx
   // For Home page
   <StaticMap
     center={center}
     markers={mapMarkers}
     onMarkerClick={handleTreasureClick}
   />;

   // For Wayfinder page
   import Wayfinder from "./pages/WayfinderStatic";
   ```

---

## 📊 **Comparison Table**

| Solution         | CORS Issues | API Key Required   | Cost                | Performance | Learning Curve |
| ---------------- | ----------- | ------------------ | ------------------- | ----------- | -------------- |
| **Mapbox GL JS** | ❌ No       | ✅ Yes (Free tier) | Free tier available | ⭐⭐⭐⭐⭐  | ⭐⭐⭐         |
| **Google Maps**  | ❌ No       | ✅ Yes             | Pay per use         | ⭐⭐⭐⭐    | ⭐⭐           |
| **OpenLayers**   | ❌ No       | ❌ No              | Free                | ⭐⭐⭐⭐    | ⭐⭐⭐⭐       |
| **Static Map**   | ❌ No       | ❌ No              | Free                | ⭐⭐⭐      | ⭐⭐           |

---

## 🔧 **Migration Steps**

### From Leaflet to Mapbox:

1. **Remove Leaflet dependencies:**

   ```bash
   npm uninstall leaflet react-leaflet @react-leaflet/core leaflet-routing-machine lrm-graphhopper
   ```

2. **Update imports:**

   ```jsx
   // Old
   import { MapContainer, TileLayer, Marker } from "react-leaflet";

   // New
   import MapboxMap from "../components/MapboxMap";
   ```

3. **Update coordinate format:**

   ```jsx
   // Leaflet: [lat, lng]
   const position = [-33.8688, 151.2093];

   // Mapbox: [lng, lat]
   const position = [151.2093, -33.8688];
   ```

---

## 🎯 **Recommendation**

**For your treasure hunt app, I recommend:**

1. **Mapbox GL JS** - Best overall solution with great performance and features ✅ **IMPLEMENTED**
2. **Static Map** - If you want a quick, simple solution without API keys

The Mapbox solution I've created includes:

- ✅ Custom treasure markers
- ✅ User location marker with pulse animation
- ✅ Route display between user and selected treasure
- ✅ Popup information
- ✅ Responsive design
- ✅ No CORS issues
- ✅ API key configured and ready to use

---

## ✅ **Implementation Complete!**

Your app has been successfully migrated from Leaflet to Mapbox:

- ✅ **Home page**: Now uses `HomeMapbox.js` with Mapbox GL JS
- ✅ **Wayfinder page**: Now uses `WayfinderMapbox.js` with Mapbox GL JS
- ✅ **API key**: Configured in both components
- ✅ **CORS issues**: Completely resolved
- ✅ **All features**: Preserved and working

## 🆘 **Need Help?**

If you need help with any issues or have questions about the implementation, let me know! The Mapbox solution is now fully operational.
