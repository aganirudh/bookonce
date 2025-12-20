/**
 * DisruptionRecovery Component
 * Handles missed connections and automatically re-plans the journey
 * with minimal cost impact by adjusting hotels, transport, etc.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Plane,
    Train,
    Bus,
    Car,
    Calendar,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { BookingConfirmation } from '@/types/booking';

interface DisruptionRecoveryProps {
    booking: BookingConfirmation;
    isOpen: boolean;
    onClose: () => void;
    onRecoveryComplete?: (newBooking: BookingConfirmation) => void;
}

type DisruptionType = 'flight' | 'train' | 'bus' | 'cab' | 'other';

interface RecoveryPlan {
    id: string;
    title: string;
    description: string;
    additionalCost: number;
    timeDelay: string;
    changes: {
        transport?: string;
        hotel?: string;
        activities?: string;
    };
    recommended: boolean;
}

export function DisruptionRecovery({
    booking,
    isOpen,
    onClose,
    onRecoveryComplete,
}: DisruptionRecoveryProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState<'select' | 'analyzing' | 'options' | 'payment' | 'success'>('select');
    const [selectedDisruption, setSelectedDisruption] = useState<DisruptionType | null>(null);
    const [recoveryPlans, setRecoveryPlans] = useState<RecoveryPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);

    // Disruption types with icons
    const disruptionTypes = [
        { type: 'flight' as DisruptionType, icon: Plane, label: 'Missed Flight', color: 'text-blue-600' },
        { type: 'train' as DisruptionType, icon: Train, label: 'Missed Train', color: 'text-green-600' },
        { type: 'bus' as DisruptionType, icon: Bus, label: 'Missed Bus', color: 'text-orange-600' },
        { type: 'cab' as DisruptionType, icon: Car, label: 'Missed Cab/Transfer', color: 'text-purple-600' },
    ];

    // Handle disruption selection
    const handleDisruptionSelect = async (type: DisruptionType) => {
        setSelectedDisruption(type);
        setStep('analyzing');

        // Simulate AI analyzing alternative plans
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate recovery plans based on disruption type
        const plans = generateRecoveryPlans(type);
        setRecoveryPlans(plans);
        setStep('options');
    };

    // Generate recovery plans using AI logic
    const generateRecoveryPlans = (type: DisruptionType): RecoveryPlan[] => {
        return [
            {
                id: '1',
                title: 'Budget Saver - Minimal Cost',
                description: 'Push hotel check-in by 1 day, take next available economy transport',
                additionalCost: 800,
                timeDelay: '8-12 hours',
                changes: {
                    transport: `Next ${type} (Economy) at 3:00 PM (+₹600)`,
                    hotel: 'Late check-in arranged, shift 1 day (+₹200)',
                    activities: 'Day 1 activities moved to Day 2',
                },
                recommended: false,
            },
            {
                id: '2',
                title: 'Smart Recovery - Balanced',
                description: 'Optimal transport timing with minor hotel adjustment',
                additionalCost: 1500,
                timeDelay: '4-6 hours',
                changes: {
                    transport: `Next ${type} (Standard) at 5:00 PM (+₹1100)`,
                    hotel: 'Same-day late check-in confirmed (+₹400)',
                    activities: 'Evening activities auto-rescheduled',
                },
                recommended: true,
            },
            {
                id: '3',
                title: 'Express Mode - Fast Track',
                description: 'Premium transport, keep original hotel schedule',
                additionalCost: 2800,
                timeDelay: '2-3 hours',
                changes: {
                    transport: type === 'flight' ? 'Next premium flight at 2:00 PM (+₹2500)' : 'Express train/taxi (+₹2200)',
                    hotel: 'Original check-in time maintained (+₹300)',
                    activities: 'All activities on original schedule',
                },
                recommended: false,
            },
            {
                id: '4',
                title: 'Alternative Route',
                description: 'Different route via connecting city, more options',
                additionalCost: 1800,
                timeDelay: '5-7 hours',
                changes: {
                    transport: `Via connecting city, multiple ${type} options (+₹1400)`,
                    hotel: 'Check-in extended by 4 hours (+₹400)',
                    activities: 'Rerouted with stopover sightseeing',
                },
                recommended: false,
            },
            {
                id: '5',
                title: 'Multi-Modal Switch',
                description: 'Combine multiple transport types for best value',
                additionalCost: 1200,
                timeDelay: '6-8 hours',
                changes: {
                    transport: type === 'flight' ? 'Train + Cab combination (+₹900)' : 'Bus + Train combo (+₹800)',
                    hotel: 'Flexible check-in, same day (+₹300)',
                    activities: 'Minor timing adjustments',
                },
                recommended: false,
            },
        ];
    };

    // Handle proceed to payment
    const handleProceedToPayment = () => {
        if (!selectedPlan) return;
        const plan = recoveryPlans.find(p => p.id === selectedPlan);
        if (!plan) return;

        // If no additional cost, skip payment
        if (plan.additionalCost === 0) {
            handleConfirmRecovery();
            return;
        }

        setStep('payment');
    };

    // Handle payment confirmation and booking update
    const handleConfirmRecovery = async () => {
        const plan = recoveryPlans.find(p => p.id === selectedPlan);
        if (!plan) return;

        setIsRecovering(true);

        // Simulate payment and booking update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create updated booking
        const updatedBooking: BookingConfirmation = {
            ...booking,
            pricing: {
                ...booking.pricing,
                total: booking.pricing.total + plan.additionalCost,
            },
            status: 'confirmed',
            updatedAt: new Date().toISOString(),
        };

        setIsRecovering(false);
        setStep('success');

        // Wait briefly to show success message
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (onRecoveryComplete) {
            onRecoveryComplete(updatedBooking);
        }

        onClose();
    };

    // Get icon for disruption type
    const getDisruptionIcon = () => {
        const disruption = disruptionTypes.find(d => d.type === selectedDisruption);
        const Icon = disruption?.icon || AlertTriangle;
        return <Icon className="h-3 w-3 text-muted-foreground mt-0.5" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Disruption Recovery
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'payment'
                            ? 'Complete payment to confirm your new journey'
                            : step === 'success'
                                ? 'Your journey has been updated successfully!'
                                : "Let's find you the best alternative to minimize cost and delay"}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[calc(85vh-140px)] pr-2">
                    {/* Step 1: Select Disruption Type */}
                    {step === 'select' && (
                        <div className="space-y-4">
                            <Alert>
                                <Sparkles className="h-4 w-4" />
                                <AlertDescription>
                                    Our AI will analyze your journey and find the best recovery plan with minimal
                                    additional cost
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <h3 className="font-medium">What did you miss?</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {disruptionTypes.map(({ type, icon: Icon, label, color }) => (
                                        <Button
                                            key={type}
                                            variant="outline"
                                            className="h-20 flex flex-col gap-2 hover:border-primary"
                                            onClick={() => handleDisruptionSelect(type)}
                                        >
                                            <Icon className={`h-6 w-6 ${color}`} />
                                            <span className="text-sm">{label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Booking Reference: <span className="font-mono">{booking.referenceNumber}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Analyzing */}
                    {step === 'analyzing' && (
                        <div className="py-12 text-center">
                            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                            </div>
                            <h3 className="font-semibold mb-2">Analyzing Alternatives...</h3>
                            <p className="text-sm text-muted-foreground">
                                Finding the best recovery options for your journey
                            </p>
                            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Checking next available transport
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Optimizing hotel dates
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Calculating cost adjustments
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Recovery Options */}
                    {step === 'options' && (
                        <div className="space-y-4">
                            <Alert>
                                <Sparkles className="h-4 w-4" />
                                <AlertDescription>
                                    We found {recoveryPlans.length} recovery options for your journey
                                </AlertDescription>
                            </Alert>

                            <RadioGroup value={selectedPlan || ''} onValueChange={setSelectedPlan}>
                                <div className="space-y-3">
                                    {recoveryPlans.map(plan => (
                                        <Card
                                            key={plan.id}
                                            className={`cursor-pointer transition-all ${selectedPlan === plan.id
                                                    ? 'border-primary shadow-md'
                                                    : 'hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedPlan(plan.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <Label htmlFor={plan.id} className="font-semibold cursor-pointer">
                                                                    {plan.title}
                                                                </Label>
                                                                {plan.recommended && (
                                                                    <Badge variant="default" className="ml-2 bg-green-500">
                                                                        Recommended
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-primary">
                                                                    +₹{plan.additionalCost.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">extra cost</div>
                                                            </div>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>

                                                        <div className="space-y-2 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-muted-foreground">Delay: {plan.timeDelay}</span>
                                                            </div>

                                                            {plan.changes.transport && (
                                                                <div className="flex items-start gap-2">
                                                                    {getDisruptionIcon()}
                                                                    <span>{plan.changes.transport}</span>
                                                                </div>
                                                            )}

                                                            {plan.changes.hotel && (
                                                                <div className="flex items-start gap-2">
                                                                    <Calendar className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                                    <span>{plan.changes.hotel}</span>
                                                                </div>
                                                            )}

                                                            {plan.changes.activities && (
                                                                <div className="flex items-start gap-2">
                                                                    <CheckCircle className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                                    <span>{plan.changes.activities}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </RadioGroup>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" onClick={onClose} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleProceedToPayment}
                                    disabled={!selectedPlan}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {recoveryPlans.find(p => p.id === selectedPlan)?.additionalCost === 0
                                        ? 'Confirm Recovery'
                                        : 'Proceed to Payment'}
                                </Button>
                            </div>

                            {selectedPlan && (
                                <Alert>
                                    <DollarSign className="h-4 w-4" />
                                    <AlertDescription>
                                        New total:{' '}
                                        <span className="font-bold">
                                            ₹
                                            {(
                                                booking.pricing.total +
                                                (recoveryPlans.find(p => p.id === selectedPlan)?.additionalCost || 0)
                                            ).toLocaleString()}
                                        </span>{' '}
                                        (original: ₹{booking.pricing.total.toLocaleString()})
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 'payment' && selectedPlan && (
                        <div className="space-y-4">
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    Recovery plan selected! Complete payment to update your booking.
                                </AlertDescription>
                            </Alert>

                            {(() => {
                                const plan = recoveryPlans.find(p => p.id === selectedPlan);
                                if (!plan) return null;

                                return (
                                    <Card className="border-2 border-primary">
                                        <CardContent className="p-6 space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">{plan.title}</h3>
                                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Original Total</p>
                                                    <p className="font-semibold">₹{booking.pricing.total.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Additional Cost</p>
                                                    <p className="font-semibold text-orange-600">
                                                        +₹{plan.additionalCost.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="col-span-2 pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground">New Total</p>
                                                    <p className="font-bold text-xl text-primary">
                                                        ₹{(booking.pricing.total + plan.additionalCost).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Changes Summary:</p>
                                                <div className="space-y-2 text-sm">
                                                    {plan.changes.transport && (
                                                        <div className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                            <span>{plan.changes.transport}</span>
                                                        </div>
                                                    )}
                                                    {plan.changes.hotel && (
                                                        <div className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                            <span>{plan.changes.hotel}</span>
                                                        </div>
                                                    )}
                                                    {plan.changes.activities && (
                                                        <div className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                            <span>{plan.changes.activities}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}

                            <Alert>
                                <DollarSign className="h-4 w-4" />
                                <AlertDescription>
                                    Payment will be processed securely. Your booking will be updated immediately after
                                    confirmation.
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" onClick={() => setStep('options')} className="flex-1">
                                    Back to Options
                                </Button>
                                <Button
                                    onClick={handleConfirmRecovery}
                                    disabled={isRecovering}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
                                >
                                    {isRecovering ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Pay ₹
                                            {recoveryPlans.find(p => p.id === selectedPlan)?.additionalCost.toLocaleString()}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 'success' && (
                        <div className="py-12 text-center">
                            <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-xl mb-2">Journey Updated Successfully!</h3>
                            <p className="text-muted-foreground mb-4">
                                Your booking has been updated with the new travel plan
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Payment confirmed
                                </div>
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Transport updated
                                </div>
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Hotel schedule adjusted
                                </div>
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Confirmation email sent
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
