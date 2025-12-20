import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  X,
  Languages,
  Footprints,
  ShoppingBag,
  MessageCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

const LocalShadowWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'matching' | 'chat'>('select');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');

  const services = [
    {
      id: 'translator',
      icon: Languages,
      label: 'Translator',
      description: 'Real-time language help',
    },
    {
      id: 'buddy',
      icon: Footprints,
      label: 'Walking Buddy',
      description: 'Explore together safely',
    },
    {
      id: 'bargain',
      icon: ShoppingBag,
      label: 'Bargaining Help',
      description: 'Get the best deals',
    },
  ];

  const localProfile = {
    name: 'Rahul K.',
    role: 'Local Guide',
    distance: '500m away',
    rating: 4.9,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep('matching');

    // Simulate matching
    setTimeout(() => {
      setStep('chat');
      setMessages([
        {
          from: 'local',
          text: `Hi! I'm ${localProfile.name}. I'll be happy to help you with ${serviceId === 'translator' ? 'translation' : serviceId === 'buddy' ? 'exploring the area' : 'getting the best deals'}. How can I assist?`,
        },
      ]);
    }, 2500);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, { from: 'user', text: inputValue }]);
    setInputValue('');

    // Simulate response
    setTimeout(() => {
      const responses = [
        "Sure, I can help with that! Let me know when you're ready.",
        'Great question! In my experience, the best approach is...',
        'I know a perfect spot for that. Want me to take you there?',
        "No problem! I'll translate that for you right away.",
      ];
      setMessages(prev => [
        ...prev,
        {
          from: 'local',
          text: responses[Math.floor(Math.random() * responses.length)],
        },
      ]);
    }, 1000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('select');
      setSelectedService(null);
      setMessages([]);
    }, 300);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-accent text-primary-foreground shadow-glow flex items-center justify-center"
      >
        <Users className="w-6 h-6" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            />

            {/* Widget Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 right-6 w-[90%] max-w-sm z-50 glass-strong rounded-3xl overflow-hidden shadow-lg"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      Local Shadow
                    </h3>
                    <p className="text-xs text-muted-foreground">Connect with locals instantly</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {/* Service Selection */}
                  {step === 'select' && (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-sm text-muted-foreground mb-4">
                        What kind of help do you need?
                      </p>
                      {services.map(service => (
                        <motion.button
                          key={service.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectService(service.id)}
                          className="w-full p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-left flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <service.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{service.label}</p>
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}

                  {/* Matching */}
                  {step === 'matching' && (
                    <motion.div
                      key="matching"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 mx-auto mb-4"
                      >
                        <Loader2 className="w-16 h-16 text-primary" />
                      </motion.div>
                      <h4 className="font-serif text-lg font-semibold text-foreground mb-2">
                        Finding nearby locals...
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Searching for available {selectedService}s in your area
                      </p>
                    </motion.div>
                  )}

                  {/* Chat */}
                  {step === 'chat' && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Connected Profile */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10">
                        <img
                          src={localProfile.avatar}
                          alt={localProfile.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{localProfile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {localProfile.distance} • ⭐ {localProfile.rating}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-success text-success-foreground rounded-lg">
                          Connected
                        </span>
                      </div>

                      {/* Messages */}
                      <div className="h-48 overflow-y-auto space-y-3 scrollbar-hide">
                        {messages.map((msg, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                                msg.from === 'user'
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-secondary text-foreground rounded-bl-md'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={e => setInputValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSendMessage}
                          className="p-3 rounded-xl bg-primary text-primary-foreground"
                        >
                          <Send className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LocalShadowWidget;
