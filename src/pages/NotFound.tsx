import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-text-primary">404</h1>
        <p className="mb-4 text-xl text-text-secondary">Oops! Page not found</p>
        <a href="/" className="text-accent-color underline hover:opacity-80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
