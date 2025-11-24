import { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { GlobeButton } from "@/components/GlobeButton";
import { LeftDrawer } from "@/components/LeftDrawer";
import { RightDrawer } from "@/components/RightDrawer";

export const Layout = () => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hide globe buttons on the globe page to avoid overlap
  const isGlobePage = location.pathname === '/globe';

  return (
    <>
      {/* Top-Left Planet - Tasks Drawer (hidden on globe page) */}
      {!isGlobePage && (
        <GlobeButton
          position="top-left"
          variant="menu"
          onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
          isActive={leftDrawerOpen}
        />
      )}

      {/* Top-Right Planet - Companion Drawer (hidden on globe page) */}
      {!isGlobePage && (
        <GlobeButton
          position="top-right"
          variant="home"
          onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
          isActive={rightDrawerOpen}
        />
      )}

      {/* Left Tasks Drawer */}
      <LeftDrawer
        isOpen={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        onNavigate={(path) => navigate(path)}
      />

      {/* Right Companion Drawer */}
      <RightDrawer
        isOpen={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
      />

      {/* Page Content */}
      <Outlet />
    </>
  );
};
