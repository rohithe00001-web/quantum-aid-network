import { Search, Clock, Menu } from "lucide-react";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSidebar } from "./MobileSidebar";

export function Header() {
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="h-full px-3 md:px-6 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            )}
            
            {/* Search - Hidden on mobile, shown on desktop */}
            {!isMobile && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search operations..."
                  className="w-80 h-10 pl-10 pr-4 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-muted rounded text-[10px] font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            )}
            
            {/* Mobile Logo */}
            {isMobile && (
              <span className="font-semibold text-foreground">
                Opti<span className="text-primary">Relief</span>
              </span>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Time - Simplified on mobile */}
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">
                {time.toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="text-xs uppercase hidden md:inline">UTC</span>
            </div>

            {/* Status - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-4 px-4 border-l border-border">
              <StatusIndicator status="online" label="Systems" />
              <StatusIndicator status="processing" label="Quantum" />
            </div>

            {/* Notifications */}
            <NotificationsDropdown />

            {/* User - Simplified on mobile */}
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-border">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">Ops Center</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="font-mono text-xs md:text-sm font-semibold text-primary">OC</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      )}
    </>
  );
}
