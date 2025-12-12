import { motion } from "framer-motion";
import { Home, Building2, Plane, Sparkles, User, Shield, Menu, X, Hourglass, Zap, Calendar, MapIcon, Compass } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChatStore } from "@/stores/chatStore";

interface NavbarProps {
  onSafetyClick: () => void;
  isOffline: boolean;
  onContextClick?: () => void;
  onMapClick?: () => void;
}

const Navbar = ({ onSafetyClick, isOffline, onContextClick, onMapClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOpen: isChatOpen, setOpen: setChatOpen } = useChatStore();

  const navItems = [
    { icon: Home, label: "Home", href: "/", isRoute: true },
    { icon: Building2, label: "Stays", href: "#stays", isRoute: false },
    { icon: Compass, label: "Utilities", href: "/utilities", isRoute: true },
    { icon: Hourglass, label: "Last Mile", href: "#lastmile", special: "vanishing", isRoute: false },
    { icon: Sparkles, label: "Vagabond AI", href: "#ai", highlight: true, isRoute: false, onClick: () => setChatOpen(true), isActive: isChatOpen },
    { icon: Calendar, label: "My Bookings", href: "/profile/bookings", isRoute: true, requiresAuth: true },
    { icon: User, label: "Profile", href: "/profile", isRoute: true, requiresAuth: true },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between shadow-lg border border-slate-200/50">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">V</span>
            </div>
            <span className="font-serif text-xl font-semibold text-foreground hidden sm:block">
              Vagabond
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems
              .filter((item) => !item.requiresAuth || user)
              .map((item) => {
                const className = `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  item.highlight
                    ? item.isActive
                      ? "bg-gradient-accent text-primary-foreground shadow-glow ring-2 ring-primary/50"
                      : "bg-gradient-accent text-primary-foreground shadow-glow"
                    : item.special === "vanishing"
                    ? "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`;

                const content = (
                  <>
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.special === "vanishing" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </>
                );

                if (item.onClick) {
                  return (
                    <motion.button
                      key={item.label}
                      onClick={item.onClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={className}
                    >
                      {content}
                    </motion.button>
                  );
                }

                return item.isRoute ? (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to={item.href} className={`${className} no-underline`}>
                      {content}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${className} no-underline`}
                  >
                    {content}
                  </motion.a>
                );
              })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Map Button */}
            {onMapClick && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMapClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Open Map"
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Map</span>
              </motion.button>
            )}

            {/* Context Layer Button */}
            {onContextClick && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onContextClick}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all relative"
              >
                <Zap className="w-5 h-5" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </motion.button>
            )}

            {/* Safety Shield */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onSafetyClick}
              className={`p-2 rounded-xl transition-all ${
                isOffline 
                  ? "bg-destructive text-destructive-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Shield className="w-5 h-5" />
            </motion.button>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ 
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="glass-strong rounded-2xl mt-2 p-4 space-y-1">
            {navItems
              .filter((item) => !item.requiresAuth || user)
              .map((item) => {
                const className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.highlight
                    ? item.isActive
                      ? "bg-gradient-accent text-primary-foreground ring-2 ring-primary/50"
                      : "bg-gradient-accent text-primary-foreground"
                    : item.special === "vanishing"
                    ? "bg-red-500/10 text-red-600 border border-red-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`;

                const content = (
                  <>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.special === "vanishing" && (
                      <span className="relative flex h-2 w-2 ml-auto">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </>
                );

                if (item.onClick) {
                  return (
                    <motion.button
                      key={item.label}
                      onClick={() => {
                        item.onClick();
                        setIsMenuOpen(false);
                      }}
                      whileTap={{ scale: 0.98 }}
                      className={`${className} w-full`}
                    >
                      {content}
                    </motion.button>
                  );
                }

                return item.isRoute ? (
                  <motion.div
                    key={item.label}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link to={item.href} className={`${className} no-underline`}>
                      {content}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMenuOpen(false)}
                    className={`${className} no-underline`}
                  >
                    {content}
                  </motion.a>
                );
              })}
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
