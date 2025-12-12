import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Star, 
  Shield, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to BookOnce Community Map",
    description: "Your trusted companion for safe and informed travel decisions",
    icon: MapPin,
    content: [
      "🗺️ Interactive world map with real-time data",
      "🌟 Community-driven reviews and ratings", 
      "🛡️ Safety reports and crime statistics",
      "📱 Social media safety alerts",
      "👥 Trusted community insights"
    ],
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Discover Places & Reviews",
    description: "Click anywhere on the map to explore nearby places",
    icon: Star,
    content: [
      "📍 Click any location to see nearby places",
      "⭐ View ratings and authentic reviews",
      "🍽️ Find restaurants, cafes, and attractions",
      "📞 Get contact info and opening hours",
      "💬 Read community experiences"
    ],
    color: "bg-yellow-500"
  },
  {
    id: 3,
    title: "Safety First",
    description: "Stay informed about area safety and crime reports",
    icon: Shield,
    content: [
      "🚨 Real-time crime statistics",
      "🚔 Police station locations",
      "⚠️ Community safety alerts",
      "📊 Area safety ratings",
      "🏥 Emergency services nearby"
    ],
    color: "bg-green-500"
  },
  {
    id: 4,
    title: "Community Contributions",
    description: "Help others by sharing your experiences",
    icon: Users,
    content: [
      "✍️ Write reviews for places you visit",
      "📸 Share photos and experiences",
      "🛡️ Report safety concerns",
      "👍 Rate the helpfulness of reviews",
      "🤝 Build a trusted travel community"
    ],
    color: "bg-purple-500"
  },
  {
    id: 5,
    title: "Social Safety Network",
    description: "Real-time updates from social media and community",
    icon: MessageSquare,
    content: [
      "🐦 Twitter safety alerts and updates",
      "📱 Reddit community discussions",
      "📢 Local news and announcements",
      "⚡ Real-time incident reports",
      "🔔 Get notified about area changes"
    ],
    color: "bg-indigo-500"
  }
];

export const MapTutorial = ({ isOpen, onClose, onComplete }: MapTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    // Tutorial will show again on next page reload
  };

  const handleSkip = () => {
    if (showSkipConfirm) {
      handleComplete();
    } else {
      setShowSkipConfirm(true);
      setTimeout(() => setShowSkipConfirm(false), 3000);
    }
  };

  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Tutorial Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="modal-container"
          >
            <div className="modal-content tutorial-modal">
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${currentStepData.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {currentStepData.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Step {currentStep + 1} of {tutorialSteps.length}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${currentStepData.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <p className="text-muted-foreground mb-6">
                  {currentStepData.description}
                </p>

                <div className="space-y-3">
                  {currentStepData.content.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-secondary/30 border-t border-border">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className={`text-sm ${showSkipConfirm ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {showSkipConfirm ? 'Confirm Skip' : 'Skip Tutorial'}
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2"
                    >
                      {currentStep === tutorialSteps.length - 1 ? (
                        <>
                          Get Started
                          <Check className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};