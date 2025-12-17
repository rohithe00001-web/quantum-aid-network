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

const recentOperations = [
  {
    id: 1,
    type: "Fleet Dispatch",
    location: "Sector 7-Alpha",
    status: "active",
    time: "2 min ago",
  },
  {
    id: 2,
    type: "Resource Drop",
    location: "Shelter B-12",
    status: "completed",
    time: "8 min ago",
  },
  {
    id: 3,
    type: "Evacuation Route",
    location: "Highway 101-N",
    status: "processing",
    time: "15 min ago",
  },
  {
    id: 4,
    type: "Grid Repair",
    location: "Substation 4",
    status: "warning",
    time: "23 min ago",
  },
];

const activeAlerts = [
  { id: 1, level: "critical", message: "Flash flood warning - Zone 3", time: "5m" },
  { id: 2, level: "warning", message: "Power grid at 15% capacity", time: "12m" },
  { id: 3, level: "info", message: "New satellite imagery available", time: "18m" },
];

const mapMarkers = [
  // All markers tightly clustered around MG Road area
  // Vehicles
  { id: "v1", lng: 77.6070, lat: 12.9750, type: "vehicle" as const, label: "Alpha-7" },
  { id: "v2", lng: 77.6085, lat: 12.9745, type: "vehicle" as const, label: "Bravo-3" },
  { id: "v3", lng: 77.6060, lat: 12.9740, type: "vehicle" as const, label: "Charlie-2" },
  { id: "v4", lng: 77.6095, lat: 12.9755, type: "vehicle" as const, label: "Delta-5" },
  { id: "v5", lng: 77.6075, lat: 12.9735, type: "vehicle" as const, label: "Echo-1" },
  { id: "v6", lng: 77.6050, lat: 12.9760, type: "vehicle" as const, label: "Foxtrot-4" },
  // Shelters
  { id: "s1", lng: 77.6080, lat: 12.9765, type: "shelter" as const, label: "MG Road Shelter (45/100)" },
  { id: "s2", lng: 77.6055, lat: 12.9752, type: "shelter" as const, label: "Brigade Shelter (78/150)" },
  { id: "s3", lng: 77.6100, lat: 12.9738, type: "shelter" as const, label: "Trinity Shelter (60/120)" },
  { id: "s4", lng: 77.6065, lat: 12.9770, type: "shelter" as const, label: "Church St Shelter (32/80)" },
  // Alerts
  { id: "a1", lng: 77.6090, lat: 12.9742, type: "alert" as const, label: "Waterlogging Alert" },
  { id: "a2", lng: 77.6045, lat: 12.9758, type: "alert" as const, label: "Traffic Block" },
  { id: "a3", lng: 77.6072, lat: 12.9768, type: "alert" as const, label: "Power Outage" },
  { id: "a4", lng: 77.6058, lat: 12.9732, type: "alert" as const, label: "Medical Emergency" },
  { id: "a5", lng: 77.6088, lat: 12.9762, type: "alert" as const, label: "Fire Alert" },
  // Resources
  { id: "r1", lng: 77.6068, lat: 12.9748, type: "resource" as const, label: "Supply Depot" },
  { id: "r2", lng: 77.6052, lat: 12.9745, type: "resource" as const, label: "Medical Camp" },
  { id: "r3", lng: 77.6092, lat: 12.9750, type: "resource" as const, label: "Water Station" },
  { id: "r4", lng: 77.6078, lat: 12.9758, type: "resource" as const, label: "Food Center" },
  { id: "r5", lng: 77.6062, lat: 12.9762, type: "resource" as const, label: "Aid Station" },
];

export default function Dashboard() {

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time disaster response operations overview
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Zap className="w-4 h-4" />
            Initiate Quantum Solve
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
              <StatusIndicator status="online" label="Live" />
            </div>

            <div className="relative h-80">
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
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">
                Recent Operations
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest quantum-optimized dispatches
              </p>
            </div>
            <button className="text-sm text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
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
