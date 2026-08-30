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
  id?: string;
  provider?: string;
  providerRouteIndex?: number;
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  summary: string;
}

interface RoutingApiResponse<T> { success: boolean; data?: T; error?: string }

async function readRoutingResponse<T>(response: Response, fallback: string): Promise<T> {
  let payload: RoutingApiResponse<T>;
  try {
    payload = (await response.json()) as RoutingApiResponse<T>;
  } catch {
    throw new Error(fallback);
  }
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error || fallback);
  }
  return payload.data;
}

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

    return readRoutingResponse(response, 'Failed to calculate route. Please try again.');
  }

  async getRoutes(
    start: RoutePoint,
    end: RoutePoint,
    mode: 'walk' | 'drive' | 'bike' = 'drive',
    maxAlternatives = 3
  ): Promise<Route[]> {
    const response = await fetch('/api/routing/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end, mode, maxAlternatives }),
    });
    return readRoutingResponse(response, 'Failed to calculate route alternatives. Please try again.');
  }

  async getMultiModalRoute(start: RoutePoint, end: RoutePoint): Promise<Route> {
    return this.getRoute(start, end, 'walk');
  }
}

export const routingService = new RoutingService();
export default routingService;
