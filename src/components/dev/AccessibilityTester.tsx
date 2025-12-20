/**
 * Accessibility Tester Component
 * Development-only component for testing accessibility compliance
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { validateThemeContrast, a11yTest, type ContrastCheck } from '@/utils/accessibility';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Props for AccessibilityTester component
 */
interface AccessibilityTesterProps {
  /** Whether to show the tester by default */
  defaultVisible?: boolean;
}

/**
 * Accessibility Tester Component
 * Only renders in development mode
 */
export function AccessibilityTester({ defaultVisible = false }: AccessibilityTesterProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [contrastChecks, setContrastChecks] = useState<ContrastCheck[]>([]);
  const { theme, resolvedTheme, systemPrefersHighContrast, systemPrefersReducedMotion } =
    useTheme();

  /**
   * Run contrast checks when theme changes
   */
  useEffect(() => {
    const runChecks = () => {
      const checks = validateThemeContrast();
      setContrastChecks(checks);
    };

    // Run initial checks
    runChecks();

    // Run checks after a brief delay to ensure CSS variables are updated
    const timeout = setTimeout(runChecks, 100);

    return () => clearTimeout(timeout);
  }, [resolvedTheme]);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  /**
   * Run all accessibility tests
   */
  const runAllTests = () => {
    a11yTest.logContrastRatios();
    a11yTest.checkImageAltText();
    a11yTest.checkHeadingHierarchy();
  };

  /**
   * Get status color for contrast ratio
   */
  const getContrastStatus = (check: ContrastCheck) => {
    if (check.meetsAAA) return 'success';
    if (check.meetsAA) return 'warning';
    return 'destructive';
  };

  /**
   * Get status icon for contrast ratio
   */
  const getContrastIcon = (check: ContrastCheck) => {
    if (check.meetsAAA) return CheckCircle;
    if (check.meetsAA) return Info;
    return AlertTriangle;
  };

  if (!isVisible) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsVisible(true)}
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
          title="Open Accessibility Tester"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden"
      >
        <Card className="shadow-xl bg-background/95 backdrop-blur-sm border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                A11y Tester
              </CardTitle>
              <Button
                onClick={() => setIsVisible(false)}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Close Accessibility Tester"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Theme Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Current Theme</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Theme: {theme}</Badge>
                <Badge variant="outline">Resolved: {resolvedTheme}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={systemPrefersHighContrast ? 'default' : 'secondary'}>
                  High Contrast: {systemPrefersHighContrast ? 'Yes' : 'No'}
                </Badge>
                <Badge variant={systemPrefersReducedMotion ? 'default' : 'secondary'}>
                  Reduced Motion: {systemPrefersReducedMotion ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {/* Contrast Checks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Contrast Ratios</h4>
                <Button
                  onClick={runAllTests}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                >
                  Run Tests
                </Button>
              </div>

              <div className="space-y-2">
                {contrastChecks.map((check, index) => {
                  const StatusIcon = getContrastIcon(check);
                  const status = getContrastStatus(check);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <StatusIcon
                        className={`h-4 w-4 shrink-0 ${status === 'success'
                            ? 'text-green-600'
                            : status === 'warning'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{check.property}</div>
                        <div className="text-xs text-muted-foreground">
                          {check.ratio.toFixed(2)}:1
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge
                          variant={check.meetsAA ? 'default' : 'destructive'}
                          className="text-xs px-1 py-0"
                        >
                          AA
                        </Badge>
                        <Badge
                          variant={check.meetsAAA ? 'default' : 'secondary'}
                          className="text-xs px-1 py-0"
                        >
                          AAA
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => a11yTest.logContrastRatios()}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Log Contrast
                </Button>
                <Button
                  onClick={() => a11yTest.checkImageAltText()}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Check Images
                </Button>
                <Button
                  onClick={() => a11yTest.checkHeadingHierarchy()}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Check Headings
                </Button>
                <Button
                  onClick={() => {
                    // Focus the first focusable element
                    const focusable = document.querySelector(
                      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    ) as HTMLElement;
                    focusable?.focus();
                  }}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Test Focus
                </Button>
              </div>
            </div>

            {/* Accessibility Tips */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tips</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• AA: 4.5:1 normal text, 3:1 large text</div>
                <div>• AAA: 7:1 normal text, 4.5:1 large text</div>
                <div>• Use Tab to test keyboard navigation</div>
                <div>• Test with screen reader software</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to use accessibility tester
 */
export function useAccessibilityTester() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Enable in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsEnabled(true);
    }
  }, []);

  return {
    isEnabled,
    runContrastCheck: validateThemeContrast,
    runAllTests: () => {
      a11yTest.logContrastRatios();
      a11yTest.checkImageAltText();
      a11yTest.checkHeadingHierarchy();
    },
  };
}
