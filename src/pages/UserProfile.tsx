/**
 * User Profile Dashboard
 * Professional dashboard displaying user statistics, recent bookings, and quick actions
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  MapPin,
  Settings as SettingsIcon,
  TrendingUp,
  Hotel,
  Plane,
  Clock,
  ArrowRight,
  Bell,
  Mail,
  Phone,
  Shield,
  CreditCard,
  LogOut,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

/**
 * User Dashboard Component
 */
export default function UserProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingTrips: 0,
    totalSpent: 0,
    placesVisited: 0,
  });

  useEffect(() => {
    // In a real app, fetch actual booking stats from API
    // For now, using placeholder data
    setStats({
      totalBookings: 12,
      upcomingTrips: 2,
      totalSpent: 145000,
      placesVisited: 8,
    });
  }, []);

  // Redirect if no user
  if (!user) {
    return null;
  }

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // Get user initials for avatar
  const userName = user.displayName || user.email?.split('@')[0] || 'User';
  const userInitials =
    userName.length >= 2
      ? `${userName.charAt(0)}${userName.charAt(1)}`.toUpperCase()
      : userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Profile Card */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{user.displayName || 'User'}</h1>
                    <p className="text-muted-foreground break-all max-w-md">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Account
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Member since {format(new Date(), 'MMM yyyy')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Upcoming Trips</p>
                  <p className="text-3xl font-bold">{stats.upcomingTrips}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Plane className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-3xl font-bold">₹{(stats.totalSpent / 1000).toFixed(0)}k</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Places Visited</p>
                  <p className="text-3xl font-bold">{stats.placesVisited}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/profile/bookings" className="block">
                  <Button variant="ghost" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">My Bookings</p>
                        <p className="text-xs text-muted-foreground">View all your trips</p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                </Link>

                <Link to="/profile/settings" className="block">
                  <Button variant="ghost" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <SettingsIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">Settings</p>
                        <p className="text-xs text-muted-foreground">Manage preferences</p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                </Link>

                <Link to="/" className="block">
                  <Button variant="ghost" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <Hotel className="h-5 w-5 text-primary" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">Book New Trip</p>
                        <p className="text-xs text-muted-foreground">Plan your next journey</p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium text-xs break-all">{user.uid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Activity & Upcoming */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Trips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Upcoming Trips</span>
                  <Badge variant="secondary">{stats.upcomingTrips} Active</Badge>
                </CardTitle>
                <CardDescription>Your next adventures await</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.upcomingTrips > 0 ? (
                  <div className="space-y-4">
                    {/* Placeholder for upcoming trips - will be integrated with real booking data */}
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Hotel className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">Weekend Getaway</h3>
                            <p className="text-sm text-muted-foreground mb-2">Coming Soon</p>
                          </div>
                          <Badge>Confirmed</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>View Details</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link to="/profile/bookings">
                      <Button variant="outline" className="w-full">
                        View All Bookings
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">No upcoming trips planned</p>
                    <Link to="/">
                      <Button>
                        Plan Your Next Trip
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Your latest bookings and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Placeholder for recent activity - will be integrated with real data */}
                  <div className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">Booking Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        Your hotel reservation has been confirmed
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">Journey Planned</p>
                      <p className="text-sm text-muted-foreground">Created a new travel route</p>
                      <p className="text-xs text-muted-foreground mt-1">5 days ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">Profile Updated</p>
                      <p className="text-sm text-muted-foreground">
                        Changed notification preferences
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Travel Insights</CardTitle>
                <CardDescription>Your travel patterns and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Favorite Destination</p>
                    <p className="font-semibold">Coming Soon</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Travel Style</p>
                    <p className="font-semibold">Leisure</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Avg. Trip Duration</p>
                    <p className="font-semibold">4 days</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Member Status</p>
                    <p className="font-semibold">Explorer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
