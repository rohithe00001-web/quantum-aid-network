import { motion } from "framer-motion";
import {
  Truck,
  Users,
  AlertTriangle,
  Activity,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { MetricCard } from "@/components/ui/MetricCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { OperationsMap } from "@/components/map/OperationsMap";
import { LocationTracker } from "@/components/map/LocationTracker";

const recentOperations = [
  {
    id: 1,
    type: "Fleet Dispatch",
    location: "MG Road, Bangalore",
    status: "active",
    time: "2 min ago",
  },
  {
    id: 2,
    type: "Resource Drop",
    location: "Cubbon Park Shelter",
    status: "completed",
    time: "8 min ago",
  },
  {
    id: 3,
    type: "Evacuation Route",
    location: "Outer Ring Road",
    status: "processing",
    time: "15 min ago",
  },
  {
    id: 4,
    type: "Grid Repair",
    location: "Koramangala Substation",
    status: "warning",
    time: "23 min ago",
  },
];

const activeAlerts = [
  { id: 1, level: "critical", message: "Flash flood warning - Majestic Area", time: "5m" },
  { id: 2, level: "warning", message: "Power grid at 15% - Whitefield", time: "12m" },
  { id: 3, level: "info", message: "New satellite imagery - Electronic City", time: "18m" },
];

const mapMarkers = [
  // Vehicles spread across Bangalore - KA registration
  { id: "v1", lng: 77.6070, lat: 12.9750, type: "vehicle" as const, label: "KA-01-MG-7001 (MG Road)" },
  { id: "v2", lng: 77.6412, lat: 12.9716, type: "vehicle" as const, label: "KA-01-IN-3002 (Indiranagar)" },
  { id: "v3", lng: 77.6245, lat: 12.9352, type: "vehicle" as const, label: "KA-01-KR-2003 (Koramangala)" },
  { id: "v4", lng: 77.7500, lat: 12.9698, type: "vehicle" as const, label: "KA-01-WF-5004 (Whitefield)" },
  { id: "v5", lng: 77.5838, lat: 12.9308, type: "vehicle" as const, label: "KA-01-JN-1005 (Jayanagar)" },
  { id: "v6", lng: 77.6692, lat: 12.8458, type: "vehicle" as const, label: "KA-01-EC-4006 (Electronic City)" },
  { id: "v7", lng: 77.6974, lat: 12.9591, type: "vehicle" as const, label: "KA-01-MH-6007 (Marathahalli)" },
  { id: "v8", lng: 77.6101, lat: 12.9166, type: "vehicle" as const, label: "KA-01-BT-8008 (BTM Layout)" },
  { id: "v9", lng: 77.6389, lat: 12.9116, type: "vehicle" as const, label: "KA-01-HS-9009 (HSR Layout)" },
  { id: "v10", lng: 77.5946, lat: 12.9719, type: "vehicle" as const, label: "KA-01-ML-1010 (Malleshwaram)" },
  
  // Shelters across Bangalore
  { id: "s1", lng: 77.6080, lat: 12.9765, type: "shelter" as const, label: "MG Road Relief Center (45/100)" },
  { id: "s2", lng: 77.6400, lat: 12.9780, type: "shelter" as const, label: "Indiranagar Community Hall (78/150)" },
  { id: "s3", lng: 77.6280, lat: 12.9340, type: "shelter" as const, label: "Koramangala Stadium Shelter (120/200)" },
  { id: "s4", lng: 77.7520, lat: 12.9720, type: "shelter" as const, label: "Whitefield ITPL Shelter (90/150)" },
  { id: "s5", lng: 77.5800, lat: 12.9280, type: "shelter" as const, label: "Jayanagar Complex Shelter (55/100)" },
  { id: "s6", lng: 77.6700, lat: 12.8500, type: "shelter" as const, label: "Electronic City Tech Park (200/300)" },
  
  // Alerts across Bangalore
  { id: "a1", lng: 77.6090, lat: 12.9742, type: "alert" as const, label: "Waterlogging - Commercial St" },
  { id: "a2", lng: 77.6450, lat: 12.9700, type: "alert" as const, label: "Traffic Block - 100ft Road Indiranagar" },
  { id: "a3", lng: 77.6200, lat: 12.9300, type: "alert" as const, label: "Power Outage - Koramangala 5th Block" },
  { id: "a4", lng: 77.7480, lat: 12.9650, type: "alert" as const, label: "Road Damage - Whitefield Main Rd" },
  { id: "a5", lng: 77.5900, lat: 12.9350, type: "alert" as const, label: "Medical Emergency - Jayanagar 4th Block" },
  { id: "a6", lng: 77.6950, lat: 12.9550, type: "alert" as const, label: "Fire Alert - Marathahalli Bridge" },
  { id: "a7", lng: 77.6350, lat: 12.9100, type: "alert" as const, label: "Flooding - HSR Sector 2" },
  
  // Resources across Bangalore
  { id: "r1", lng: 77.6068, lat: 12.9748, type: "resource" as const, label: "Supply Depot - Garuda Mall" },
  { id: "r2", lng: 77.6380, lat: 12.9750, type: "resource" as const, label: "Medical Camp - Indiranagar ESI" },
  { id: "r3", lng: 77.6300, lat: 12.9380, type: "resource" as const, label: "Water Station - Forum Koramangala" },
  { id: "r4", lng: 77.7550, lat: 12.9750, type: "resource" as const, label: "Food Center - Phoenix Whitefield" },
  { id: "r5", lng: 77.5820, lat: 12.9250, type: "resource" as const, label: "Aid Station - Jayanagar Shopping" },
  { id: "r6", lng: 77.6650, lat: 12.8420, type: "resource" as const, label: "Emergency HQ - Electronic City Phase 1" },
  { id: "r7", lng: 77.6000, lat: 12.9700, type: "resource" as const, label: "Blood Bank - Malleshwaram" },
];

export default function Dashboard() {

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Command Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Real-time disaster response operations overview
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden xs:inline">Initiate</span> Quantum Solve
          </motion.button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Truck}
            label="Active Vehicles"
            value={47}
            subValue="+3 en route"
            trend="up"
            variant="primary"
          />
          <MetricCard
            icon={Users}
            label="People Evacuated"
            value="12,847"
            subValue="Target: 15,000"
            trend="up"
            variant="success"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Active Alerts"
            value={8}
            subValue="2 critical"
            trend="down"
            variant="warning"
          />
          <MetricCard
            icon={Activity}
            label="Quantum Ops/min"
            value="1,247"
            subValue="Peak efficiency"
            trend="neutral"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Visualization */}
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden" variant="quantum">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">
                  Operations Map
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live fleet and resource positioning
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LocationTracker />
                <StatusIndicator status="online" label="Live" />
              </div>
            </div>

            <div className="relative h-60 sm:h-80">
              <OperationsMap markers={mapMarkers} />
            </div>
          </GlassCard>

          {/* Alerts Panel */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Active Alerts</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Priority incidents
              </p>
            </div>
            <div className="p-2">
              {activeAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-lg mb-2 last:mb-0 border ${
                    alert.level === "critical"
                      ? "bg-destructive/10 border-destructive/30"
                      : alert.level === "warning"
                      ? "bg-warning/10 border-warning/30"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 ${
                          alert.level === "critical"
                            ? "text-destructive"
                            : alert.level === "warning"
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-sm text-foreground">{alert.message}</p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {alert.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Recent Operations */}
        <GlassCard className="p-0">
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground text-sm sm:text-base">
                Recent Operations
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Latest quantum-optimized dispatches
              </p>
            </div>
            <button className="text-xs sm:text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          
          {/* Mobile Card View */}
          <div className="sm:hidden p-2 space-y-2">
            {recentOperations.map((op, i) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg border border-border/50 bg-secondary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {op.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {op.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <StatusIndicator
                        status={
                          op.status === "active"
                            ? "online"
                            : op.status === "processing"
                            ? "processing"
                            : "warning"
                        }
                        showPulse={op.status !== "completed"}
                      />
                    )}
                    <span className="text-xs capitalize text-muted-foreground">
                      {op.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{op.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{op.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.map((op, i) => (
                  <motion.tr
                    key={op.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">
                        {op.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {op.location}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {op.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <StatusIndicator
                            status={
                              op.status === "active"
                                ? "online"
                                : op.status === "processing"
                                ? "processing"
                                : "warning"
                            }
                            showPulse={op.status !== "completed"}
                          />
                        )}
                        <span className="text-sm capitalize text-foreground">
                          {op.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm">{op.time}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
