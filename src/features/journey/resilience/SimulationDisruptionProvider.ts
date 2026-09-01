import type { TravelDisruption } from './disruptionTypes';

export type SimulationScenario = 'delay-30' | 'delay-180' | 'transport-cancellation' | 'activity-closure';

export interface DisruptionProvider {
  getDisruptions(targetNodeId: string, scenario: SimulationScenario): Promise<TravelDisruption[]>;
}

export class SimulationDisruptionProvider implements DisruptionProvider {
  async getDisruptions(targetNodeId: string, scenario: SimulationScenario): Promise<TravelDisruption[]> {
    const provenance = { source: 'simulation' as const, referenceId: scenario };
    if (scenario === 'delay-30' || scenario === 'delay-180') {
      return [{ type: 'transport_delay', targetNodeId, delayMinutes: scenario === 'delay-30' ? 30 : 180, provenance }];
    }
    return [{
      type: scenario === 'transport-cancellation' ? 'transport_cancellation' : 'activity_closure',
      targetNodeId,
      provenance,
    }];
  }
}
