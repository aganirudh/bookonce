/**
 * SavedPaymentMethods Component
 * Display and select saved payment methods with biometric authentication
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Fingerprint, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isBiometricAvailable,
  getBiometricTypeName,
  authenticateForSavedCard,
} from '../utils/biometricAuth';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault?: boolean;
}

interface SavedPaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId: string | null;
  onSelectMethod: (methodId: string) => void;
  onAddNew: () => void;
  className?: string;
}

/**
 * Component for displaying and selecting saved payment methods
 * Includes biometric authentication for security
 */
export function SavedPaymentMethods({
  paymentMethods,
  selectedMethodId,
  onSelectMethod,
  onAddNew,
  className,
}: SavedPaymentMethodsProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const biometricAvailable = isBiometricAvailable();
  const biometricName = getBiometricTypeName();

  const handleSelectMethod = async (methodId: string) => {
    // If biometric is available, require authentication
    if (biometricAvailable) {
      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const authenticated = await authenticateForSavedCard();

        if (authenticated) {
          onSelectMethod(methodId);
        } else {
          setAuthError(`${biometricName} authentication failed. Please try again.`);
        }
      } catch (error) {
        setAuthError('Authentication failed. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      // No biometric, select directly
      onSelectMethod(methodId);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd use actual card brand icons
    return <CreditCard className="h-5 w-5" />;
  };

  if (paymentMethods.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground mb-4">No saved payment methods</p>
        <Button onClick={onAddNew}>Add Payment Method</Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Payment Methods</h3>
        {biometricAvailable && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Fingerprint className="h-3 w-3" />
            {biometricName} Enabled
          </Badge>
        )}
      </div>

      {authError && (
        <Alert variant="destructive">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {paymentMethods.map(method => {
          const isSelected = selectedMethodId === method.id;
          const isExpired =
            method.expiryYear < new Date().getFullYear() ||
            (method.expiryYear === new Date().getFullYear() &&
              method.expiryMonth < new Date().getMonth() + 1);

          return (
            <Card
              key={method.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary',
                isExpired && 'opacity-50'
              )}
              onClick={() => !isExpired && !isAuthenticating && handleSelectMethod(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCardBrandIcon(method.brand)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ••••{' '}
                          {method.last4}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAuthenticating && selectedMethodId === method.id && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {isSelected && !isAuthenticating && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    {biometricAvailable && !isSelected && !isExpired && (
                      <Fingerprint className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        variant="outline"
        className="w-full min-h-[44px]"
        onClick={onAddNew}
        disabled={isAuthenticating}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Add New Payment Method
      </Button>

      {biometricAvailable && (
        <p className="text-xs text-center text-muted-foreground">
          {biometricName} authentication required to use saved cards
        </p>
      )}
    </div>
  );
}
