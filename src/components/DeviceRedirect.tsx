import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const DeviceRedirect = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't redirect on admin, install, or reset-password pages
    if (
      currentPath === '/admin' || 
      currentPath === '/install' || 
      currentPath === '/reset-password'
    ) {
      return;
    }

    // Redirect mobile users to /mobile if they're on /
    if (isMobile && currentPath === '/') {
      navigate('/mobile', { replace: true });
    }
    
    // Redirect desktop users to / if they're on /mobile
    if (!isMobile && currentPath === '/mobile') {
      navigate('/', { replace: true });
    }
  }, [isMobile, location.pathname, navigate]);

  return <>{children}</>;
};
