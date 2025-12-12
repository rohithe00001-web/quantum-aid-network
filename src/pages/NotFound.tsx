import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-warning" />
        </div>
        <div>
          <h1 className="text-6xl font-mono font-bold text-foreground mb-2">404</h1>
          <p className="text-muted-foreground">Sector not found in operations grid</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" />
          Return to Command Center
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
