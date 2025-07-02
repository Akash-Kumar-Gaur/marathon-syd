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
import Home from "./pages/Home";
import PhotoBooth from "./pages/PhotoBooth";

// Navigation logger component
const NavigationLogger = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("=== ROUTE CHANGE ===");
    console.log("New route:", location.pathname);
    console.log("Route state:", location.state);
    console.log("History length:", window.history.length);
    console.log("History state:", window.history.state);
    console.log("==================");
  }, [location]);

  return null;
};

function App() {
  return (
    <div className="App">
      <Router>
        <NavigationLogger />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/hunt" element={<LearnToHunt />} />
          <Route path="/home" element={<Home />} />
          <Route path="/photobooth" element={<PhotoBooth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
