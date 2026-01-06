import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { startBurnoutMonitoring } from './ai/burnoutDetector';

// Register service worker for PWA with auto-update
// Note: updateSW(true) already triggers a safe reload once the new SW is activated.
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New version available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline');
  },
  onRegisteredSW(swUrl, registration) {
    console.log('[PWA] Service worker registered:', swUrl);
    // Check for updates every 60 seconds
    setInterval(() => {
      registration?.update();
    }, 60 * 1000);
  },
});

// Start burnout monitoring
startBurnoutMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
