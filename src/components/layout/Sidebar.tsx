import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Route,
  Package,
  Car,
  Zap,
  ScanLine,
  Settings,
  Atom,
  AlertCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Command Center", path: "/", roles: ["admin", "operator", "volunteer", "user"] },
  { icon: Route, label: "Fleet Routing", path: "/routing", roles: ["admin", "operator", "volunteer"] },
  { icon: Package, label: "Resource Allocation", path: "/resources", roles: ["admin", "operator", "volunteer"] },
  { icon: Car, label: "Evacuation Flow", path: "/evacuation", roles: ["admin", "operator", "volunteer"] },
  { icon: Zap, label: "Grid Recovery", path: "/grid", roles: ["admin", "operator", "volunteer"] },
  { icon: ScanLine, label: "Q-Vision Analysis", path: "/qvision", roles: ["admin", "operator", "volunteer"] },
  { icon: AlertCircle, label: "Hazard Feed", path: "/hazard-feed", roles: ["admin", "operator"] },
  { icon: Users, label: "User Management", path: "/user-management", roles: ["admin"] },
];

export function Sidebar() {
  const location = useLocation();
  const { role } = useAuth();
  
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(role || "user")
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Atom className="w-8 h-8 text-primary" />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-2 h-2 bg-primary rounded-full absolute -top-1 left-1/2 -translate-x-1/2" />
            </motion.div>
          </div>
          <div>
            <h1 className="font-semibold text-foreground tracking-tight">
              Opti<span className="text-primary">Relief</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Disaster Response
            </p>
          </div>
        </div>
      </div>

      {/* Quantum Status */}
      <div className="px-4 py-3 mx-4 mt-4 rounded-lg bg-secondary/50 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Quantum Core
          </span>
          <StatusIndicator status="online" showPulse />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-quantum-glow"
              initial={{ width: "0%" }}
              animate={{ width: "87%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-xs text-primary">87%</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute right-0 w-0.5 h-6 bg-primary rounded-l-full"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink 
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors",
            location.pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
