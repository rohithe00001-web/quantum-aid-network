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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();
  const { role } = useAuth();
  
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(role || "user")
  );

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="relative">
              <Atom className="w-7 h-7 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-foreground tracking-tight">
                Opti<span className="text-primary">Relief</span>
              </span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Disaster Response
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

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
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
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
              </NavLink>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <NavLink 
            to="/settings"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-3 w-full rounded-lg transition-colors",
              location.pathname === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </div>
      </SheetContent>
    </Sheet>
  );
}
