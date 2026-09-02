export const DISRUPTION_CAPABILITIES = Object.freeze(['flight_status', 'rail_status', 'road_incident', 'activity_closure']);

// Provider adapters expose { provider, capabilities, timeoutMs, getDisruptions(query) }.
// They return normalized observations only and never receive internal node IDs.
export class FixtureDisruptionProvider {
  constructor({ provider = 'fixture-only', capabilities = ['flight_status'], observations = [], timeoutMs = 100 } = {}) {
    this.provider = provider;
    this.capabilities = Object.freeze([...capabilities]);
    this.timeoutMs = timeoutMs;
    this.observations = observations.map(observation => structuredClone(observation));
    this.fixtureOnly = true;
  }

  async getDisruptions() { return this.observations.map(observation => structuredClone(observation)); }
}

export class DisruptionProviderRegistry {
  constructor(adapters = []) { this.adapters = new Map(adapters.map(adapter => [adapter.provider, adapter])); }
  get(provider) { return this.adapters.get(provider); }
  configuredProviders() { return [...this.adapters.values()].filter(adapter => !adapter.fixtureOnly).map(adapter => ({ provider: adapter.provider, capabilities: [...adapter.capabilities] })); }
}

export async function createConfiguredDisruptionRegistry(options = {}) {
  const { createAviationstackAdapter } = await import('./adapters/aviationstack.js');
  const aviationstack = createAviationstackAdapter(options.aviationstack);
  return new DisruptionProviderRegistry(aviationstack ? [aviationstack] : []);
}
