/**
 * Safety Service - Community Safety & Crime Data Integration
 *
 * Integrates multiple free APIs and data sources for safety information:
 * - Crime statistics and reports
 * - Police station locations
 * - Emergency services
 * - Social media safety alerts
 * - Community safety reports
 */

interface SafetyData {
  id: string;
  type: 'crime' | 'police' | 'hospital' | 'emergency' | 'alert' | 'community';
  coordinates: [number, number];
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
  verified: boolean;
  category?: string;
  address?: string;
  contact?: string;
  website?: string;
}

interface CrimeStats {
  area: string;
  coordinates: [number, number];
  safetyScore: number; // 1-10 scale
  crimeRate: number;
  recentIncidents: number;
  categories: {
    theft: number;
    assault: number;
    vandalism: number;
    fraud: number;
    other: number;
  };
  trend: 'improving' | 'stable' | 'worsening';
  lastUpdated: string;
}

interface SocialAlert {
  id: string;
  platform: 'twitter' | 'reddit' | 'local_news';
  content: string;
  location: string;
  coordinates?: [number, number];
  timestamp: string;
  urgency: 'info' | 'warning' | 'urgent';
  verified: boolean;
  source_url?: string;
  engagement: number;
}

class SafetyService {
  private readonly OVERPASS_API = 'https://overpass-api.de/api/interpreter';
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org';

  // Note: In production, you'd use real APIs. These are simulated for demo
  private readonly CRIME_API_BASE = 'https://api.crime-data.org'; // Simulated
  private readonly SOCIAL_API_BASE = 'https://api.social-alerts.org'; // Simulated

  /**
   * Get safety data for a specific area
   */
  async getSafetyData(lat: number, lng: number, radius: number = 2000): Promise<SafetyData[]> {
    try {
      const safetyData: SafetyData[] = [];

      // Get police stations and emergency services from OpenStreetMap
      const emergencyData = await this.getEmergencyServices(lat, lng, radius);
      safetyData.push(...emergencyData);

      // Get simulated crime data (in production, use real crime APIs)
      const crimeData = await this.getCrimeReports(lat, lng, radius);
      safetyData.push(...crimeData);

      // Get community safety reports
      const communityData = await this.getCommunityReports(lat, lng, radius);
      safetyData.push(...communityData);

      return safetyData.sort((a, b) => {
        // Sort by severity and recency
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;

        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    } catch (error) {
      console.error('Error fetching safety data:', error);
      return [];
    }
  }

  /**
   * Get emergency services (police, hospitals, fire stations) from OpenStreetMap
   */
  private async getEmergencyServices(
    lat: number,
    lng: number,
    radius: number
  ): Promise<SafetyData[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="police"](around:${radius},${lat},${lng});
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="fire_station"](around:${radius},${lat},${lng});
        node["emergency"="phone"](around:${radius},${lat},${lng});
      );
      out body;
    `;

    try {
      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) throw new Error('Failed to fetch emergency services');

      const data = await response.json();

      return data.elements.map((element: any) => ({
        id: `emergency_${element.id}`,
        type: this.mapEmergencyType(element.tags?.amenity || element.tags?.emergency),
        coordinates: [element.lat, element.lon] as [number, number],
        title:
          element.tags?.name ||
          this.getDefaultName(element.tags?.amenity || element.tags?.emergency),
        description: this.getEmergencyDescription(element.tags?.amenity || element.tags?.emergency),
        severity: 'low' as const,
        timestamp: new Date().toISOString(),
        source: 'OpenStreetMap',
        verified: true,
        contact: element.tags?.phone,
        website: element.tags?.website,
        address:
          element.tags?.['addr:full'] ||
          `${element.tags?.['addr:housenumber'] || ''} ${element.tags?.['addr:street'] || ''}`.trim(),
      }));
    } catch (error) {
      console.error('Error fetching emergency services:', error);
      return [];
    }
  }

  /**
   * Get simulated crime reports (in production, integrate with real crime APIs)
   */
  private async getCrimeReports(lat: number, lng: number, radius: number): Promise<SafetyData[]> {
    // Simulate crime data - in production, use real APIs like:
    // - UK: Police API (data.police.uk)
    // - US: FBI Crime Data API
    // - EU: Eurostat Crime Statistics
    // - Local government crime APIs

    const crimeTypes = [
      { type: 'theft', severity: 'medium', description: 'Theft reported in the area' },
      { type: 'vandalism', severity: 'low', description: 'Vandalism incident reported' },
      { type: 'assault', severity: 'high', description: 'Assault reported - exercise caution' },
      { type: 'fraud', severity: 'medium', description: 'Fraud case reported in vicinity' },
      { type: 'burglary', severity: 'high', description: 'Burglary reported nearby' },
    ];

    const numReports = Math.floor(Math.random() * 5) + 1; // 1-5 reports
    const reports: SafetyData[] = [];

    for (let i = 0; i < numReports; i++) {
      const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
      const offsetLat = (Math.random() - 0.5) * 0.02; // ~1km radius
      const offsetLng = (Math.random() - 0.5) * 0.02;

      reports.push({
        id: `crime_${Date.now()}_${i}`,
        type: 'crime',
        coordinates: [lat + offsetLat, lng + offsetLng],
        title: `${crimeType.type.charAt(0).toUpperCase() + crimeType.type.slice(1)} Report`,
        description: crimeType.description,
        severity: crimeType.severity as 'low' | 'medium' | 'high',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        source: 'Local Police',
        verified: true,
        category: crimeType.type,
      });
    }

    return reports;
  }

  /**
   * Get community safety reports
   */
  private async getCommunityReports(
    lat: number,
    lng: number,
    radius: number
  ): Promise<SafetyData[]> {
    // Simulate community reports - in production, this would come from your database
    const communityReports = [
      {
        title: 'Well-lit area, feels safe',
        description: 'Good lighting and regular foot traffic. Feels safe even at night.',
        severity: 'low' as const,
        type: 'community' as const,
      },
      {
        title: 'Avoid after dark',
        description:
          'Community reports suggest avoiding this area after sunset due to poor lighting.',
        severity: 'medium' as const,
        type: 'alert' as const,
      },
      {
        title: 'Tourist scam alert',
        description: 'Multiple reports of tourist-targeted scams in this area. Stay vigilant.',
        severity: 'medium' as const,
        type: 'alert' as const,
      },
      {
        title: 'Safe family area',
        description: 'Family-friendly area with good community presence and safety measures.',
        severity: 'low' as const,
        type: 'community' as const,
      },
    ];

    const numReports = Math.floor(Math.random() * 3) + 1;
    const reports: SafetyData[] = [];

    for (let i = 0; i < numReports; i++) {
      const report = communityReports[Math.floor(Math.random() * communityReports.length)];
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;

      reports.push({
        id: `community_${Date.now()}_${i}`,
        type: report.type,
        coordinates: [lat + offsetLat, lng + offsetLng],
        title: report.title,
        description: report.description,
        severity: report.severity,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        source: 'Community',
        verified: false,
      });
    }

    return reports;
  }

  /**
   * Get area crime statistics
   */
  async getCrimeStatistics(lat: number, lng: number): Promise<CrimeStats> {
    // Simulate crime statistics - in production, use real crime statistics APIs
    const baseScore = Math.random() * 4 + 6; // 6-10 base safety score
    const crimeRate = Math.random() * 50 + 10; // 10-60 crimes per 1000 people

    return {
      area: await this.getAreaName(lat, lng),
      coordinates: [lat, lng],
      safetyScore: Math.round(baseScore * 10) / 10,
      crimeRate: Math.round(crimeRate),
      recentIncidents: Math.floor(Math.random() * 20) + 5,
      categories: {
        theft: Math.floor(Math.random() * 40) + 10,
        assault: Math.floor(Math.random() * 15) + 2,
        vandalism: Math.floor(Math.random() * 25) + 5,
        fraud: Math.floor(Math.random() * 20) + 3,
        other: Math.floor(Math.random() * 30) + 8,
      },
      trend: ['improving', 'stable', 'worsening'][Math.floor(Math.random() * 3)] as
        | 'improving'
        | 'stable'
        | 'worsening',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get social media safety alerts
   */
  async getSocialAlerts(lat: number, lng: number, radius: number = 5000): Promise<SocialAlert[]> {
    // Simulate social media alerts - in production, integrate with:
    // - Twitter API for real-time safety tweets
    // - Reddit API for community discussions
    // - Local news APIs
    // - Government alert systems

    const alertTemplates = [
      {
        platform: 'twitter' as const,
        content: '🚨 Traffic incident reported on Main St. Expect delays. #SafetyFirst',
        urgency: 'warning' as const,
        engagement: 45,
      },
      {
        platform: 'reddit' as const,
        content:
          'PSA: Increased police presence in downtown area due to event. All good, just FYI.',
        urgency: 'info' as const,
        engagement: 23,
      },
      {
        platform: 'local_news' as const,
        content:
          'Local authorities advise caution due to construction work affecting pedestrian routes.',
        urgency: 'warning' as const,
        engagement: 67,
      },
      {
        platform: 'twitter' as const,
        content: '⚠️ Weather alert: Heavy rain expected. Roads may be slippery. Drive safely!',
        urgency: 'warning' as const,
        engagement: 89,
      },
    ];

    const areaName = await this.getAreaName(lat, lng);
    const numAlerts = Math.floor(Math.random() * 3) + 1;
    const alerts: SocialAlert[] = [];

    for (let i = 0; i < numAlerts; i++) {
      const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];

      alerts.push({
        id: `social_${Date.now()}_${i}`,
        platform: template.platform,
        content: template.content,
        location: areaName,
        coordinates: [lat, lng],
        timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(), // Last 6 hours
        urgency: template.urgency,
        verified: template.platform === 'local_news',
        source_url: `https://${template.platform}.com/safety-alert-${i}`,
        engagement: template.engagement,
      });
    }

    return alerts.sort((a, b) => {
      const urgencyOrder = { urgent: 3, warning: 2, info: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  /**
   * Submit a community safety report
   */
  async submitSafetyReport(report: {
    coordinates: [number, number];
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
    anonymous: boolean;
  }): Promise<{ success: boolean; id?: string; message: string }> {
    try {
      // In production, this would save to your database
      console.log('Community safety report submitted:', report);

      return {
        success: true,
        id: `community_${Date.now()}`,
        message:
          'Thank you for helping keep our community safe! Your report has been submitted for review.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to submit report. Please try again later.',
      };
    }
  }

  // Helper methods
  private mapEmergencyType(amenity: string): 'police' | 'hospital' | 'emergency' {
    switch (amenity) {
      case 'police':
        return 'police';
      case 'hospital':
        return 'hospital';
      case 'fire_station':
        return 'emergency';
      case 'phone':
        return 'emergency';
      default:
        return 'emergency';
    }
  }

  private getDefaultName(amenity: string): string {
    const names = {
      police: 'Police Station',
      hospital: 'Hospital',
      fire_station: 'Fire Station',
      phone: 'Emergency Phone',
    };
    return names[amenity as keyof typeof names] || 'Emergency Service';
  }

  private getEmergencyDescription(amenity: string): string {
    const descriptions = {
      police: 'Local police station - emergency and non-emergency services',
      hospital: 'Medical facility providing emergency and healthcare services',
      fire_station: 'Fire and rescue services',
      phone: 'Emergency phone for immediate assistance',
    };
    return descriptions[amenity as keyof typeof descriptions] || 'Emergency service location';
  }

  private async getAreaName(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_API}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
        {
          headers: {
            'User-Agent': 'BookOnceApp/1.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const parts = [];
          if (data.address.city) parts.push(data.address.city);
          else if (data.address.town) parts.push(data.address.town);
          else if (data.address.village) parts.push(data.address.village);

          if (data.address.country) parts.push(data.address.country);

          return parts.join(', ') || 'Unknown Area';
        }
      }
    } catch (error) {
      console.error('Error getting area name:', error);
    }

    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  }
}

export const safetyService = new SafetyService();
export default safetyService;
