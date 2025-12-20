import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, AlertTriangle, Wifi, WifiOff, Radio, Phone } from 'lucide-react';
import { useState } from 'react';

interface SafetyMeshProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

const SafetyMesh = ({ isOpen, onClose, isOffline, onToggleOffline }: SafetyMeshProps) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSOS = () => {
    setIsBroadcasting(true);

    // Simulate broadcast
    setTimeout(() => {
      // Pre-fill SMS with dummy GPS coordinates
      const gpsCoords = '35.6762,139.6503';
      const message = encodeURIComponent(
        `EMERGENCY SOS from BookOnce App. My location: ${gpsCoords}. Please send help!`
      );
      window.open(`sms:?body=${message}`, '_blank');
      setIsBroadcasting(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Police Siren Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 modal-backdrop z-50"
          >
            {/* Blue Police Light */}
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              animate={{
                background: [
                  'rgba(159, 185, 200, 0.3)',
                  'rgba(159, 185, 200, 0)',
                ],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
            {/* Red Police Light */}
            <motion.div
              className="absolute top-0 right-0 w-full h-full"
              animate={{
                background: [
                  'rgba(97, 63, 51, 0)',
                  'rgba(97, 63, 51, 0.3)',
                ],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                type: 'spring',
                damping: 20,
                stiffness: 400,
                mass: 0.8,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.2 },
            }}
            className="fixed left-[calc(50%-260px)] top-[calc(50%-300px)] -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg z-[60] glass-strong rounded-3xl shadow-2xl max-h-[70vh] overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Header */}
            <div
              className={`px-4 py-3 border-b border-border flex items-center justify-between ${isOffline ? 'bg-destructive/10' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isOffline ? 'bg-destructive/20' : 'bg-success/20'
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 ${isOffline ? 'text-destructive' : 'text-success'}`}
                  />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    Safety Mesh
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {isOffline ? 'Offline Mode' : 'All Systems OK'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Content */}
            <div 
              className="p-4 space-y-4"
              style={{
                '--destructive': '12 31% 29%',
                '--success': '15 50% 69%',
                '--info': '200 28% 70%',
                '--warning': '252 13% 59%',
                '--secondary': '200 28% 70%',
                '--accent': '15 50% 69%'
              } as React.CSSProperties}
            >
              {/* Offline Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2">
                  {isOffline ? (
                    <WifiOff className="w-4 h-4 text-destructive" />
                  ) : (
                    <Wifi className="w-4 h-4 text-success" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Offline Mode</p>
                    <p className="text-[10px] text-muted-foreground">Test safety features</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onToggleOffline}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isOffline ? 'bg-destructive' : 'bg-secondary'
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-background rounded-full shadow-md"
                    style={{ left: isOffline ? 'calc(100% - 22px)' : '2px' }}
                  />
                </motion.button>
              </div>

              {/* Emergency Info */}
              {isOffline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-warning/10 border border-warning/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-warning">
                      High contrast enabled. SOS available via mesh network.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* SOS Button */}
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">Emergency broadcast</p>

                <div className="relative inline-block">
                  {/* Broadcasting Rings */}
                  {isBroadcasting && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-destructive/30"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-destructive/30"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSOS}
                    disabled={isBroadcasting}
                    className="relative w-24 h-24 rounded-full bg-destructive text-destructive-foreground flex flex-col items-center justify-center gap-1 shadow-lg transition-all"
                  >
                    {isBroadcasting ? (
                      <>
                        <Radio className="w-6 h-6 animate-pulse" />
                        <span className="text-[10px] font-medium">Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-6 h-6" />
                        <span className="text-sm font-bold">SOS</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 rounded-xl bg-safety-mesh-millbrook/20 hover:bg-safety-mesh-millbrook/30 transition-colors text-center border border-safety-mesh-millbrook/30"
                >
                  <span className="text-xl mb-1 block">🏥</span>
                  <span className="text-xs font-medium text-foreground">Hospital</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 rounded-xl bg-safety-mesh-my-pink/20 hover:bg-safety-mesh-my-pink/30 transition-colors text-center border border-safety-mesh-my-pink/30"
                >
                  <span className="text-xl mb-1 block">🚔</span>
                  <span className="text-xs font-medium text-foreground">Police</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 rounded-xl bg-safety-mesh-rock-blue/20 hover:bg-safety-mesh-rock-blue/30 transition-colors text-center border border-safety-mesh-rock-blue/30"
                >
                  <span className="text-xl mb-1 block">🚕</span>
                  <span className="text-xs font-medium text-foreground">Taxi</span>
                </motion.button>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Emergency Contacts</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-xs text-success font-medium">Embassy</p>
                    <p className="text-sm font-bold text-success">+1-555-0100</p>
                  </div>
                  <div className="p-3 rounded-xl bg-info/10 border border-info/20">
                    <p className="text-xs text-info font-medium">Travel Insurance</p>
                    <p className="text-sm font-bold text-info">+1-555-0200</p>
                  </div>
                </div>
              </div>

              {/* Safety Tips */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Safety Tips</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-safety-mesh-amethyst-smoke/30">
                    <span className="text-sm">📍</span>
                    <p className="text-xs text-muted-foreground">
                      Share your live location with trusted contacts
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-safety-mesh-amethyst-smoke/30">
                    <span className="text-sm">🔋</span>
                    <p className="text-xs text-muted-foreground">
                      Keep your phone charged above 20%
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-safety-mesh-amethyst-smoke/30">
                    <span className="text-sm">💰</span>
                    <p className="text-xs text-muted-foreground">
                      Keep emergency cash in multiple locations
                    </p>
                  </div>
                </div>
              </div>

              {/* Local Guardian */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-safety-mesh-amethyst-smoke/10 to-safety-mesh-my-pink/10 border border-safety-mesh-amethyst-smoke/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Local Guardian</p>
                      <p className="text-xs text-muted-foreground">24/7 Support</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-safety-mesh-my-pink to-safety-mesh-rock-blue text-primary-foreground text-sm font-medium"
                >
                  Connect Now
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SafetyMesh;
