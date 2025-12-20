import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  Plane,
  Sparkles,
  User,
  Shield,
  Menu,
  X,
  Zap,
  Calendar,
  MapIcon,
  Compass,
  LogOut,
  Settings,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChatStore } from '@/stores/chatStore';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavbarProps {
  onSafetyClick: () => void;
  isOffline: boolean;
  onMapClick?: () => void;
}

const Navbar = ({ onSafetyClick, isOffline, onMapClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { isOpen: isChatOpen, setOpen: setChatOpen } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dashboardRef.current && !dashboardRef.current.contains(event.target as Node)) {
        setIsDashboardOpen(false);
      }
    };

    if (isDashboardOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDashboardOpen]);

  const navItems = [
    { icon: Home, label: 'Home', href: '/', isRoute: true },
    { icon: Building2, label: 'Explore', href: '/stays', isRoute: true },
    { icon: Compass, label: 'Utilities', href: '/utilities', isRoute: true },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="navbar-glass rounded-2xl px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between shadow-themed-medium">
          {/* Logo */}
          <Link to="/" className="no-underline">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BO</span>
              </div>
              <span className="font-serif text-xl font-semibold text-foreground hidden sm:block">
                BookOnce
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {navItems.map(item => {
              const className = `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${item.highlight
                  ? item.isActive
                    ? 'bg-gradient-accent text-primary-foreground shadow-glow ring-2 ring-primary/50'
                    : 'bg-gradient-accent text-primary-foreground shadow-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`;

              const content = (
                <>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </>
              );

              if (item.onClick) {
                return (
                  <motion.button
                    key={item.label}
                    onClick={item.onClick}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.3,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
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
          <div className="flex items-center gap-3">
            {/* Map Button */}
            {onMapClick && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMapClick}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Open Map"
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Map</span>
              </motion.button>
            )}

            {/* Safety Shield */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onSafetyClick}
              className={`p-2 rounded-xl transition-all ${isOffline
                  ? 'bg-destructive text-destructive-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              title={isOffline ? 'Safety Mode Active' : 'Safety Information'}
            >
              <Shield className="w-5 h-5" />
            </motion.button>

            {/* Theme Toggle */}
            <ThemeToggle variant="dropdown" size="md" />

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>

            {/* Login/Dashboard Button */}
            <div className="hidden sm:block ml-4 pl-4 border-l border-border">
              {!user ? (
                <Link to="/auth" className="no-underline">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-glow transition-all font-semibold text-sm shadow-lg"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </motion.button>
                </Link>
              ) : (
                <div className="relative" ref={dashboardRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-glow transition-all font-semibold text-sm shadow-lg"
                  >
                    <User className="w-4 h-4" />
                    <span>{user?.displayName?.split(' ')[0] || 'User'}</span>
                  </motion.button>

                  {/* Dashboard Dropdown */}
                  {isDashboardOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-40"
                    >
                      <div className="p-4 border-b border-border">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={user?.email}>
                          {user?.email}
                        </p>
                      </div>

                      <div className="p-2 space-y-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsDashboardOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors no-underline"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>

                        <Link
                          to="/profile/bookings"
                          onClick={() => setIsDashboardOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors no-underline"
                        >
                          <Calendar className="w-4 h-4" />
                          My Bookings
                        </Link>

                        <Link
                          to="/profile/settings"
                          onClick={() => setIsDashboardOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors no-underline"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>

                        <div className="border-t border-border my-2"></div>

                        <button
                          onClick={() => {
                            logout();
                            setIsDashboardOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMenuOpen ? 'auto' : 0,
            opacity: isMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
          id="mobile-navigation"
          role="navigation"
          aria-label="Mobile navigation menu"
        >
          <div className="glass-strong rounded-2xl mt-2 p-4 space-y-2">
            {navItems.map(item => {
              const className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.highlight
                  ? item.isActive
                    ? 'bg-gradient-accent text-primary-foreground ring-2 ring-primary/50'
                    : 'bg-gradient-accent text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`;

              const content = (
                <>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
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
                    className={`${className} w-full text-left`}
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
                  <Link to={item.href} className={`${className} no-underline block`}>
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

            {/* Mobile Auth */}
            <div className="pt-2 mt-2 border-t border-border">
              {!user ? (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="no-underline">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm"
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </motion.button>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 font-semibold text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
