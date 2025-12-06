import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { startBurnoutMonitoring } from './ai/burnoutDetector';

// Register service worker for PWA with auto-update and forced reload
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New version available, updating...');
    // Update the service worker
    updateSW(true);
    // Force reload to get the new version
    setTimeout(() => {
      window.location.reload();
    }, 100);
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
