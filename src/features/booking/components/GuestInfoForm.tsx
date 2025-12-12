/**
 * GuestInfoForm Component
 * Form for collecting guest information during booking with validation
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { GuestInfo } from '@/types/booking';
import { sanitizeGuestInfo, detectXSS } from '../utils/inputSanitization';

// ============================================================================
// Validation Schema
// ============================================================================

const guestInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .refine(
      (val) => !detectXSS(val),
      'Invalid characters detected'
    ),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .refine(
      (val) => !detectXSS(val),
      'Invalid characters detected'
    ),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(
      (val) => !detectXSS(val),
      'Invalid characters detected'
    ),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^[\d\s\-\+\(\)]+$/,
      'Please enter a valid phone number (digits, spaces, +, -, (, ) only)'
    )
    .min(10, 'Phone number must be at least 10 characters'),
  country: z
    .string()
    .min(1, 'Country is required')
    .refine(
      (val) => !detectXSS(val),
      'Invalid characters detected'
    ),
  specialRequests: z
    .string()
    .max(500, 'Special requests must be less than 500 characters')
    .refine(
      (val) => !val || !detectXSS(val),
      'Invalid characters detected'
    )
    .optional(),
  arrivalTime: z
    .string()
    .optional(),
});

type GuestInfoFormData = z.infer<typeof guestInfoSchema>;

// ============================================================================
// Component Props
// ============================================================================

interface GuestInfoFormProps {
  initialData?: Partial<GuestInfo>;
  onSubmit: (data: GuestInfo) => void;
  onBack?: () => void;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Country List (Common countries)
// ============================================================================

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Switzerland',
  'Austria',
  'Belgium',
  'Portugal',
  'Greece',
  'Ireland',
  'New Zealand',
  'Singapore',
  'South Korea',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Malaysia',
  'Philippines',
  'Argentina',
  'Chile',
  'Colombia',
  'Peru',
  'South Africa',
  'Egypt',
  'Morocco',
  'Turkey',
  'United Arab Emirates',
  'Saudi Arabia',
  'Israel',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Romania',
  'Russia',
  'Ukraine',
];

// ============================================================================
// Component
// ============================================================================

export function GuestInfoForm({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
  className,
}: GuestInfoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestInfoSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      country: initialData?.country || '',
      specialRequests: initialData?.specialRequests || '',
      arrivalTime: initialData?.arrivalTime || '',
    },
  });

  const selectedCountry = watch('country');

  const handleFormSubmit = (data: GuestInfoFormData) => {
    // Sanitize all inputs before submission
    const sanitizedData = sanitizeGuestInfo(data);
    
    // Additional XSS detection
    const dataString = JSON.stringify(sanitizedData);
    if (detectXSS(dataString)) {
      console.error('XSS pattern detected in guest info');
      return;
    }
    
    onSubmit(sanitizedData as GuestInfo);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Guest Information</h3>
        <p className="text-sm text-muted-foreground">
          Please provide your details for the reservation
        </p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="John"
            {...register('firstName')}
            className={cn(errors.firstName && 'border-destructive')}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            {...register('lastName')}
            className={cn(errors.lastName && 'border-destructive')}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="john.doe@example.com"
          {...register('email')}
          className={cn(errors.email && 'border-destructive')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Booking confirmation will be sent to this email
        </p>
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+1 (555) 123-4567"
          {...register('phone')}
          className={cn(errors.phone && 'border-destructive')}
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Include country code for international numbers
        </p>
      </div>

      {/* Country Field */}
      <div className="space-y-2">
        <Label htmlFor="country">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedCountry}
          onValueChange={(value) => setValue('country', value, { shouldValidate: true })}
          disabled={isLoading}
        >
          <SelectTrigger
            id="country"
            className={cn(errors.country && 'border-destructive')}
          >
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && (
          <p className="text-sm text-destructive">{errors.country.message}</p>
        )}
      </div>

      {/* Arrival Time Field */}
      <div className="space-y-2">
        <Label htmlFor="arrivalTime">Estimated Arrival Time (Optional)</Label>
        <Input
          id="arrivalTime"
          type="time"
          {...register('arrivalTime')}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Help the hotel prepare for your arrival
        </p>
      </div>

      {/* Special Requests Field */}
      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
        <Textarea
          id="specialRequests"
          placeholder="E.g., early check-in, high floor, quiet room..."
          rows={4}
          maxLength={500}
          {...register('specialRequests')}
          className={cn(errors.specialRequests && 'border-destructive')}
          disabled={isLoading}
        />
        {errors.specialRequests && (
          <p className="text-sm text-destructive">
            {errors.specialRequests.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {watch('specialRequests')?.length || 0}/500 characters
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className="flex-1 sm:flex-none sm:ml-auto min-h-[44px]"
        >
          {isLoading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </div>
    </form>
  );
}
