export interface DisruptionCheckRequest {
  provider: string;
  capability: 'flight_status' | 'rail_status' | 'road_incident' | 'activity_closure';
  itineraryNodes: Array<Record<string, unknown>>;
  query: { subjects: Array<Record<string, unknown>> };
  maxObservationAgeMinutes?: number;
}

export class DisruptionClient {
  async providers(): Promise<Array<{ provider: string; capabilities: string[] }>> {
    const response = await fetch('/api/disruptions/providers');
    const body = await response.json();
    if (!response.ok || !Array.isArray(body?.providers)) return [];
    return body.providers;
  }

  async check(request: DisruptionCheckRequest): Promise<unknown> {
    const response = await fetch('/api/disruptions/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    });
    const body = await response.json();
    if (!response.ok) {
      const messages: Record<string, string> = { authentication: 'PROVIDER_AUTH', quota: 'PROVIDER_QUOTA', timeout: 'PROVIDER_TIMEOUT', 'not-configured': 'PROVIDER_NOT_CONFIGURED', 'provider-error': 'PROVIDER_UNAVAILABLE' };
      throw new Error(messages[body?.reason] ?? 'PROVIDER_UNAVAILABLE');
    }
    return body;
  }
}

export const disruptionClient = new DisruptionClient();
