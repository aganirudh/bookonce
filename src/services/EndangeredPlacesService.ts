import vanishingDataRaw from '@/data/vanishing-destinations.json';

export interface EndangeredPlace {
  id: number;
  name: string;
  location: string;
  image: string;
  yearsRemaining: number;
  threatLevel: 'critical' | 'high' | 'moderate';
  threats: string[];
  culture: string;
  witnesses: number;
  lastWitness: string;
  story: string;
  coordinates: [number, number];
}

// Type assertion to ensure the data matches our interface
const vanishingData = vanishingDataRaw as EndangeredPlace[];

export class EndangeredPlacesService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get coordinates from location string using a simple geocoding approach
   */
  private async getCoordinatesFromLocation(location: string): Promise<[number, number] | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(location)}&` +
          `format=json&` +
          `limit=1`,
        {
          headers: {
            'User-Agent': 'BookOnceApp/1.0',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }

      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  /**
   * Find endangered places near a destination
   */
  async findNearbyEndangeredPlaces(
    destination: string,
    maxDistance: number = 250 // km
  ): Promise<EndangeredPlace[]> {
    try {
      const destinationCoords = await this.getCoordinatesFromLocation(destination);

      if (!destinationCoords) {
        // If we can't geocode, try to match by location name first
        const nameMatches = vanishingData.filter(
          place =>
            place.location.toLowerCase().includes(destination.toLowerCase()) ||
            destination.toLowerCase().includes(place.location.toLowerCase())
        );

        if (nameMatches.length > 0) {
          return nameMatches.slice(0, 5);
        }

        // If no name matches, return some random places sorted by urgency
        return this.getAllEndangeredPlaces().slice(0, 3);
      }

      const [destLat, destLon] = destinationCoords;

      // Calculate distances and filter
      const placesWithDistance = vanishingData.map(place => ({
        ...place,
        distance: this.calculateDistance(
          destLat,
          destLon,
          place.coordinates[0],
          place.coordinates[1]
        ),
      }));

      // Sort by distance and filter by max distance
      const nearbyPlaces = placesWithDistance
        .filter(place => place.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Limit to 5 places

      // If no places found within distance, return closest Indian places for Indian destinations
      if (nearbyPlaces.length === 0) {
        // Check if destination is in India
        const isIndianDestination =
          destination.toLowerCase().includes('india') ||
          [
            'mumbai',
            'delhi',
            'bangalore',
            'kolkata',
            'chennai',
            'hyderabad',
            'pune',
            'ahmedabad',
            'jaipur',
            'surat',
            'lucknow',
            'kanpur',
            'nagpur',
            'indore',
            'thane',
            'bhopal',
            'visakhapatnam',
            'pimpri',
            'patna',
            'vadodara',
            'ghaziabad',
            'ludhiana',
            'agra',
            'nashik',
            'faridabad',
            'meerut',
            'rajkot',
            'kalyan',
            'vasai',
            'varanasi',
            'srinagar',
            'aurangabad',
            'dhanbad',
            'amritsar',
            'navi mumbai',
            'allahabad',
            'ranchi',
            'howrah',
            'coimbatore',
            'jabalpur',
            'gwalior',
            'vijayawada',
            'jodhpur',
            'madurai',
            'raipur',
            'kota',
            'guwahati',
            'chandigarh',
            'solapur',
            'hubli',
            'tiruchirappalli',
            'bareilly',
            'mysore',
            'tiruppur',
            'gurgaon',
            'aligarh',
            'jalandhar',
            'bhubaneswar',
            'salem',
            'warangal',
            'guntur',
            'bhiwandi',
            'saharanpur',
            'gorakhpur',
            'bikaner',
            'amravati',
            'noida',
            'jamshedpur',
            'bhilai',
            'cuttack',
            'firozabad',
            'kochi',
            'nellore',
            'bhavnagar',
            'dehradun',
            'durgapur',
            'asansol',
            'rourkela',
            'nanded',
            'kolhapur',
            'ajmer',
            'akola',
            'gulbarga',
            'jamnagar',
            'ujjain',
            'loni',
            'siliguri',
            'jhansi',
            'ulhasnagar',
            'jammu',
            'sangli',
            'mangalore',
            'erode',
            'belgaum',
            'ambattur',
            'tirunelveli',
            'malegaon',
            'gaya',
            'jalgaon',
            'udaipur',
            'maheshtala',
            'goa',
            'kerala',
            'rajasthan',
            'gujarat',
            'maharashtra',
            'karnataka',
            'tamil nadu',
            'andhra pradesh',
            'telangana',
            'west bengal',
            'odisha',
            'punjab',
            'haryana',
            'bihar',
            'jharkhand',
            'assam',
            'uttarakhand',
            'himachal pradesh',
            'jammu and kashmir',
            'ladakh',
            'nagaland',
            'manipur',
            'mizoram',
            'tripura',
            'meghalaya',
            'arunachal pradesh',
            'sikkim',
          ].some(city => destination.toLowerCase().includes(city.toLowerCase()));

        if (isIndianDestination) {
          // For Indian destinations, prioritize Indian places
          const indianPlaces = placesWithDistance.filter(
            place =>
              place.location.toLowerCase().includes('india') ||
              place.location.includes('Pradesh') ||
              place.location.includes('Maharashtra') ||
              place.location.includes('Karnataka') ||
              place.location.includes('Gujarat') ||
              place.location.includes('Rajasthan') ||
              place.location.includes('Kerala') ||
              place.location.includes('Tamil Nadu') ||
              place.location.includes('West Bengal') ||
              place.location.includes('Odisha') ||
              place.location.includes('Assam') ||
              place.location.includes('Nagaland') ||
              place.location.includes('Himachal Pradesh') ||
              place.location.includes('Uttarakhand') ||
              place.location.includes('Ladakh') ||
              place.location.includes('Andaman') ||
              place.location.includes('Mumbai') ||
              place.location.includes('Goa')
          );

          if (indianPlaces.length > 0) {
            return indianPlaces.sort((a, b) => a.distance - b.distance).slice(0, 3);
          }
        }

        // Fallback to closest places regardless of location
        const closestPlaces = placesWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3);
        return closestPlaces;
      }

      return nearbyPlaces;
    } catch (error) {
      console.error('Error finding nearby endangered places:', error);
      // Return most urgent endangered places as fallback
      return this.getAllEndangeredPlaces().slice(0, 3);
    }
  }

  /**
   * Get all endangered places sorted by urgency
   */
  getAllEndangeredPlaces(): EndangeredPlace[] {
    return [...vanishingData].sort((a, b) => {
      // Sort by threat level first (critical > high > moderate)
      const threatOrder = { critical: 3, high: 2, moderate: 1 };
      const threatDiff = threatOrder[b.threatLevel] - threatOrder[a.threatLevel];
      if (threatDiff !== 0) return threatDiff;

      // Then by years remaining (less time = higher priority)
      return a.yearsRemaining - b.yearsRemaining;
    });
  }

  /**
   * Get endangered places by threat level
   */
  getEndangeredPlacesByThreat(threatLevel: 'critical' | 'high' | 'moderate'): EndangeredPlace[] {
    return vanishingData.filter(place => place.threatLevel === threatLevel);
  }
}

export const endangeredPlacesService = new EndangeredPlacesService();
