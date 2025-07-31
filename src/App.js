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
import { UserProvider } from "./context/UserContext";
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

function App() {
  const flowConfig = getFlowConfig();

  console.log("App initialized with flow:", flowConfig.type);

  return (
    <UserProvider>
      <DrawerProvider>
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
              {isRouteEnabled("/home") && (
                <Route path="/home" element={<Home />} />
              )}
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
      </DrawerProvider>
    </UserProvider>
  );
}

export default App;
