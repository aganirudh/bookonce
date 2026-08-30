export interface RoutePoint { lat: number; lng: number; address?: string }

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type: string;
}

export interface RouteSegment {
  mode: 'walk' | 'drive' | 'bike' | 'transit';
  distance: number;
  duration: number;
  steps: RouteStep[];
  geometry: [number, number][];
}

export interface Route {
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  summary: string;
}

interface RoutingApiResponse { success: boolean; data?: Route; error?: string }

class RoutingService {
  async getRoute(
    start: RoutePoint,
    end: RoutePoint,
    mode: 'walk' | 'drive' | 'bike' = 'drive'
  ): Promise<Route> {
    const response = await fetch('/api/routing/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end, mode }),
    });

    let payload: RoutingApiResponse;
    try {
      payload = (await response.json()) as RoutingApiResponse;
    } catch {
      throw new Error('Failed to calculate route. Please try again.');
    }

    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.error || 'Failed to calculate route. Please try again.');
    }
    return payload.data;
  }

  async getMultiModalRoute(start: RoutePoint, end: RoutePoint): Promise<Route> {
    return this.getRoute(start, end, 'walk');
  }
}

export const routingService = new RoutingService();
export default routingService;
