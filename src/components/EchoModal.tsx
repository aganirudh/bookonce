import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Lock, Unlock, Volume2 } from "lucide-react";
import { useState } from "react";

interface Echo {
  id: number;
  coordinates: number[];
  title: string;
  author: string;
  avatar: string;
  duration: string;
  transcript: string;
  timestamp: string;
}

interface EchoModalProps {
  echo: Echo | null;
  isOpen: boolean;
  onClose: () => void;
  isNearby: boolean;
}

const EchoModal = ({ echo, isOpen, onClose, isNearby }: EchoModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!echo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[70] glass-strong rounded-3xl overflow-hidden shadow-lg"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{echo.title}</h3>
                  <p className="text-xs text-muted-foreground">Audio Echo</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={echo.avatar}
                  alt={echo.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{echo.author}</p>
                  <p className="text-sm text-muted-foreground">{echo.timestamp}</p>
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className={`relative p-6 rounded-2xl bg-secondary/50 ${!isNearby ? "blur-sm" : ""}`}>
                <div className="flex items-center justify-center gap-1 h-16">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-purple-500 rounded-full"
                      animate={{
                        height: isPlaying && isNearby
                          ? [8, Math.random() * 50 + 10, 8]
                          : 8,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: isPlaying && isNearby ? Infinity : 0,
                        delay: i * 0.02,
                      }}
                      style={{ height: 8 }}
                    />
                  ))}
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>{isPlaying ? "0:12" : "0:00"}</span>
                  <span>{echo.duration}</span>
                </div>

                {/* Lock Overlay */}
                {!isNearby && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Get closer to unlock</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Play Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => isNearby && setIsPlaying(!isPlaying)}
                  disabled={!isNearby}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isNearby
                      ? "bg-gradient-accent text-primary-foreground shadow-glow"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </motion.button>
              </div>

              {/* Transcript */}
              <div className={`space-y-2 ${!isNearby ? "blur-md select-none" : ""}`}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transcript</p>
                <p className="text-sm text-foreground leading-relaxed">
                  "{echo.transcript}"
                </p>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                isNearby ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
              }`}>
                {isNearby ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span className="text-sm font-medium">You're nearby - Full access unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Travel here to unlock full audio</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EchoModal;
