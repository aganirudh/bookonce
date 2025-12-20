import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, Wallet, X, Zap } from 'lucide-react';
import { Slider } from './ui/slider';

interface VibeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  energy: number;
  social: number;
  budget: number;
  onEnergyChange: (value: number[]) => void;
  onSocialChange: (value: number[]) => void;
  onBudgetChange: (value: number[]) => void;
}

const VibeSidebar = ({
  isOpen,
  onClose,
  energy,
  social,
  budget,
  onEnergyChange,
  onSocialChange,
  onBudgetChange,
}: VibeSidebarProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-4 top-24 bottom-4 w-80 glass-strong rounded-3xl shadow-medium z-50 overflow-hidden"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      Vibe Control
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success bio-sync-pulse" />
                      <span className="text-xs text-success font-medium">Bio-Sync Active</span>
                    </div>
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

              {/* Sliders */}
              <div className="space-y-8 flex-1">
                {/* Energy Level */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Energy Level</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {energy <= 3 ? 'Chill' : energy <= 7 ? 'Balanced' : 'Adventure'}
                    </span>
                  </div>
                  <Slider
                    value={[energy]}
                    onValueChange={onEnergyChange}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>🧘 Low/Chill</span>
                    <span>🏔️ High/Adventure</span>
                  </div>
                </div>

                {/* Social Battery */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Social Battery</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {social <= 3 ? 'Solo' : social <= 7 ? 'Balanced' : 'Social'}
                    </span>
                  </div>
                  <Slider
                    value={[social]}
                    onValueChange={onSocialChange}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>🎧 Introvert/Solo</span>
                    <span>🎉 Extrovert/Party</span>
                  </div>
                </div>

                {/* Budget Mood */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Budget Mood</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {budget <= 3 ? 'Thrifty' : budget <= 7 ? 'Balanced' : 'Boujee'}
                    </span>
                  </div>
                  <Slider
                    value={[budget]}
                    onValueChange={onBudgetChange}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>💰 Thrifty</span>
                    <span>💎 Boujee</span>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="pt-6 mt-auto border-t border-border">
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-medium">Pro tip:</span> Move the sliders
                    slowly and watch the listings adapt in real-time to your current mood.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VibeSidebar;
