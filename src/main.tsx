import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { startBurnoutMonitoring } from './ai/burnoutDetector';

// Register service worker for PWA with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update without prompting
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Start burnout monitoring
startBurnoutMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
