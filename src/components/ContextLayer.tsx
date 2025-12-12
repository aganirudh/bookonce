import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, X, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";

interface ContextAlert {
  id: string;
  hotelId: number;
  type: string;
  severity: string;
  icon: string;
  title: string;
  message: string;
  validUntil: string;
  alternatives: string[];
}

interface ContextLayerBadgeProps {
  alert: ContextAlert;
  compact?: boolean;
}

const severityColors: Record<string, string> = {
  high: "bg-red-500/90 text-white border-red-400",
  moderate: "bg-amber-500/90 text-white border-amber-400",
  low: "bg-blue-500/90 text-white border-blue-400",
  info: "bg-indigo-500/90 text-white border-indigo-400",
  positive: "bg-emerald-500/90 text-white border-emerald-400",
};

const severityPulse: Record<string, boolean> = {
  high: true,
  moderate: false,
  low: false,
  info: false,
  positive: false,
};

export const ContextLayerBadge = ({ alert, compact = false }: ContextLayerBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${severityColors[alert.severity]}`}
      >
        <span>{alert.icon}</span>
        <span className="max-w-[80px] truncate">{alert.title}</span>
        {severityPulse[alert.severity] && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border shadow-md ${severityColors[alert.severity]}`}
      >
        <span className="text-sm">{alert.icon}</span>
        <span>{alert.title}</span>
        {severityPulse[alert.severity] && (
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        )}
      </motion.button>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl overflow-hidden max-w-md w-full shadow-heavy"
            >
              {/* Header */}
              <div className={`p-4 ${severityColors[alert.severity]} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{alert.icon}</span>
                    <div>
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-xs opacity-80">Valid until {alert.validUntil}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                <p className="text-foreground">{alert.message}</p>

                {/* Alternatives */}
                {alert.alternatives.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Smart Alternatives
                    </h4>
                    <div className="space-y-2">
                      {alert.alternatives.map((alt, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ x: 4 }}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                        >
                          <span className="text-sm text-foreground">{alt}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Context Layer Overview Panel
interface ContextLayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContextLayerPanel = ({ isOpen, onClose }: ContextLayerPanelProps) => {
  const globalAlerts = [
    {
      region: "Your Search Area",
      alerts: [
        { icon: "🌡️", title: "Heat Advisory", severity: "moderate", count: 3 },
        { icon: "🎉", title: "Local Events", severity: "info", count: 5 },
        { icon: "🚧", title: "Disruptions", severity: "high", count: 2 },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-4 top-24 bottom-4 w-80 z-40"
        >
          <div className="glass-strong rounded-2xl h-full overflow-hidden shadow-heavy">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Context Layer</h3>
                    <p className="text-xs text-muted-foreground">Real-time intelligence</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-80px)]">
              {/* Live Status */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-medium text-foreground">Live Monitoring Active</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scanning 847 data sources for disruptions, events, and opportunities in your search area.
                </p>
              </div>

              {/* Alert Summary */}
              {globalAlerts.map((group) => (
                <div key={group.region}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {group.region}
                  </h4>
                  <div className="space-y-2">
                    {group.alerts.map((alert, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{alert.icon}</span>
                          <span className="text-sm text-foreground">{alert.title}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.severity === 'high' ? 'bg-red-500/20 text-red-600' :
                          alert.severity === 'moderate' ? 'bg-amber-500/20 text-amber-600' :
                          'bg-blue-500/20 text-blue-600'
                        }`}>
                          {alert.count}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* What We Monitor */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  What We Monitor
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    "Road Closures", "Local Events", "Weather Alerts",
                    "Crowd Levels", "Health Advisories", "Power Outages",
                    "Price Surges", "Air Quality"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextLayerBadge;
