/**
 * User Profile Page
 * Displays user information and notification preferences
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Mail, Smartphone, ChevronRight, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationPreferences, NotificationType } from '@/types/booking';

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    enabled: true,
    types: [
      'booking_confirmation',
      'booking_modification',
      'booking_cancellation',
      'check_in_reminder',
      'booking_status_change',
      'hotel_cancellation',
    ],
  },
  push: {
    enabled: false,
    types: [
      'booking_status_change',
      'check_in_reminder',
      'hotel_cancellation',
    ],
  },
};

/**
 * Notification type labels
 */
const NOTIFICATION_LABELS: Record<NotificationType, { title: string; description: string }> = {
  booking_confirmation: {
    title: 'Booking Confirmations',
    description: 'Receive confirmation when your booking is complete',
  },
  booking_modification: {
    title: 'Booking Modifications',
    description: 'Get notified when your booking is modified',
  },
  booking_cancellation: {
    title: 'Booking Cancellations',
    description: 'Receive confirmation when a booking is cancelled',
  },
  check_in_reminder: {
    title: 'Check-in Reminders',
    description: 'Get reminded 24 hours before your check-in',
  },
  booking_status_change: {
    title: 'Status Changes',
    description: 'Be notified of any changes to your booking status',
  },
  hotel_cancellation: {
    title: 'Hotel Cancellations',
    description: 'Urgent notifications if a hotel cancels your booking',
  },
};

/**
 * User Profile Component
 */
export default function UserProfile() {
  const { user, updateProfile, logout } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initialize preferences from user profile
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPreferences(user.notificationPreferences);
    }
  }, [user]);

  // Redirect if no user (shouldn't happen with ProtectedRoute, but safety check)
  if (!user) {
    return null;
  }

  /**
   * Toggle email notifications
   */
  const toggleEmailNotifications = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, enabled },
    }));
  };

  /**
   * Toggle push notifications
   */
  const togglePushNotifications = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      push: { ...prev.push, enabled },
    }));
  };

  /**
   * Toggle specific email notification type
   */
  const toggleEmailType = (type: NotificationType, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email: {
        ...prev.email,
        types: enabled
          ? [...prev.email.types, type]
          : prev.email.types.filter(t => t !== type),
      },
    }));
  };

  /**
   * Toggle specific push notification type
   */
  const togglePushType = (type: NotificationType, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      push: {
        ...prev.push,
        types: enabled
          ? [...prev.push.types, type]
          : prev.push.types.filter(t => t !== type),
      },
    }));
  };

  /**
   * Save notification preferences
   */
  const savePreferences = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Update user profile with new preferences
      await updateProfile({ notificationPreferences: preferences });
      
      setSaveMessage('Preferences saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and notification preferences
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* User Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Name</Label>
              <p className="font-medium">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">User ID</Label>
              <p className="font-medium text-xs text-muted-foreground">{user.userId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/profile/bookings">
            <Button variant="ghost" className="w-full justify-between">
              <span>My Bookings</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Notification Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive updates about your bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-semibold">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.email.enabled}
                onCheckedChange={toggleEmailNotifications}
              />
            </div>

            {preferences.email.enabled && (
              <div className="ml-8 space-y-3 pt-2">
                {(Object.keys(NOTIFICATION_LABELS) as NotificationType[]).map(type => (
                  <div key={type} className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label htmlFor={`email-${type}`} className="text-sm font-medium">
                        {NOTIFICATION_LABELS[type].title}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {NOTIFICATION_LABELS[type].description}
                      </p>
                    </div>
                    <Switch
                      id={`email-${type}`}
                      checked={preferences.email.types.includes(type)}
                      onCheckedChange={(checked) => toggleEmailType(type, checked)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Push Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push-notifications" className="text-base font-semibold">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on your mobile device
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences.push.enabled}
                onCheckedChange={togglePushNotifications}
              />
            </div>

            {preferences.push.enabled && (
              <div className="ml-8 space-y-3 pt-2">
                {(Object.keys(NOTIFICATION_LABELS) as NotificationType[]).map(type => (
                  <div key={type} className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label htmlFor={`push-${type}`} className="text-sm font-medium">
                        {NOTIFICATION_LABELS[type].title}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {NOTIFICATION_LABELS[type].description}
                      </p>
                    </div>
                    <Switch
                      id={`push-${type}`}
                      checked={preferences.push.types.includes(type)}
                      onCheckedChange={(checked) => togglePushType(type, checked)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={savePreferences}
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            {saveMessage && (
              <p className={`mt-2 text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
