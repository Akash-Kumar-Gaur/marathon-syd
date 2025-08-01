import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./App.css";
import SplashScreen from "./components/SplashScreen";
import Welcome from "./pages/Welcome";
import LearnToHunt from "./pages/LearnToHunt";
import Home from "./pages/HomeMapbox";
import PhotoBooth from "./pages/PhotoBooth";
import FindMyRoute from "./pages/FindMyRoute";
import Wayfinder from "./pages/WayfinderMapbox";
import { DrawerProvider } from "./context/DrawerContext";
import { UserProvider, useUser } from "./context/UserContext";
import { getFlowConfig, isRouteEnabled } from "./config/flowConfig";
import "./services/firebase";

// Navigation logger component
const NavigationLogger = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("=== ROUTE CHANGE ===");
    console.log("New route:", location.pathname);
    console.log("Route state:", location.state);
    console.log("History length:", window.history.length);
    console.log("History state:", window.history.state);
    console.log("Current flow:", getFlowConfig().type);
    console.log("==================");
  }, [location]);

  return null;
};

// Loading component
const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f0f8ff",
    }}
  >
    <div
      style={{
        textAlign: "center",
        color: "#081F2D",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #e3f2fd",
          borderTop: "4px solid #1976d2",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px",
        }}
      ></div>
      <p>Loading...</p>
    </div>
  </div>
);

// App content with user context
const AppContent = () => {
  const { isLoading } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const flowConfig = getFlowConfig();
  console.log("App initialized with flow:", flowConfig.type);

  return (
    <div className="App">
      <Router>
        <NavigationLogger />
        <Routes>
          {/* Splash screen is always available */}
          <Route path="/" element={<SplashScreen />} />

          {/* Conditionally render routes based on flow configuration */}
          {isRouteEnabled("/welcome") && (
            <Route path="/welcome" element={<Welcome />} />
          )}
          {isRouteEnabled("/hunt") && (
            <Route path="/hunt" element={<LearnToHunt />} />
          )}
          {isRouteEnabled("/home") && <Route path="/home" element={<Home />} />}
          {isRouteEnabled("/photobooth") && (
            <Route path="/photobooth" element={<PhotoBooth />} />
          )}
          {isRouteEnabled("/find-my-route") && (
            <Route path="/find-my-route" element={<FindMyRoute />} />
          )}
          {isRouteEnabled("/find-my-route") && (
            <Route path="/wayfinder" element={<Wayfinder />} />
          )}

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <DrawerProvider>
        <AppContent />
      </DrawerProvider>
    </UserProvider>
  );
}

export default App;
