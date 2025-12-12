import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ScanLine, Upload, Play, RotateCcw, CheckCircle2, AlertTriangle, Droplets, Mountain } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { QuantumLoader } from "@/components/ui/QuantumLoader";

interface ClassificationResult {
  label: string;
  confidence: number;
  color: string;
  icon: any;
}

export default function QVisionAnalysis() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setResults([]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = () => {
    if (!uploadedImage) return;
    
    setIsAnalyzing(true);
    setResults([]);

    setTimeout(() => {
      setIsAnalyzing(false);
      setResults([
        { label: "Flood Zone", confidence: 94, color: "primary", icon: Droplets },
        { label: "Passable Road", confidence: 87, color: "success", icon: CheckCircle2 },
        { label: "Debris Field", confidence: 76, color: "warning", icon: AlertTriangle },
        { label: "Dry Land", confidence: 91, color: "success", icon: Mountain },
      ]);
    }, 3000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Q-Vision Hazard Detection
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quantum Support Vector Machine for aerial imagery classification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setUploadedImage(null);
                setResults([]);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadedImage}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <QuantumLoader size="sm" />
              ) : (
                <ScanLine className="w-4 h-4" />
              )}
              {isAnalyzing ? "Analyzing..." : "Run QSVM Analysis"}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <GlassCard className="p-0" variant="quantum">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Aerial Imagery</h2>
            </div>
            <div className="p-6">
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded aerial imagery"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {isAnalyzing && (
                    <motion.div
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <QuantumLoader size="lg" label="QSVM Processing" />
                      <motion.div
                        className="absolute inset-0 overflow-hidden rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                          animate={{ y: [0, 256, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`h-64 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                  <p className="text-sm text-foreground mb-1">
                    Drop aerial imagery here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports satellite, drone, and aerial photos
                  </p>
                  <label className="mt-4 px-4 py-2 bg-secondary rounded-lg text-sm text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
                    Or browse files
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setUploadedImage(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Analysis Results */}
          <GlassCard className="p-0">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Classification Results</h2>
            </div>
            <div className="p-6">
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result, i) => {
                    const Icon = result.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 text-${result.color}`} />
                            <span className="text-sm font-medium text-foreground">
                              {result.label}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-foreground">
                            {result.confidence}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-${result.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence}%` }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <p className="text-sm text-foreground mb-2">
                      <strong>QSVM Analysis Complete</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Identified 2 passable routes and 1 hazard zone. 
                      Recommended action: Dispatch ground units via northern corridor.
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <ScanLine className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Upload an image and run analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Quantum Kernel Methods",
              description: "Leverage QSVM for high-dimensional feature classification on complex terrain data",
            },
            {
              title: "Real-Time Processing",
              description: "Process drone footage in near real-time for rapid situational awareness",
            },
            {
              title: "Multi-Class Detection",
              description: "Simultaneously classify roads, water, debris, and passable terrain",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-lg bg-secondary/30 border border-border/50"
            >
              <h3 className="text-sm font-medium text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
