import { Badge } from '@/components/ui/badge';

export type DataProvenance = 'verified' | 'simulation' | 'bookonce-derived' | 'bookonce-estimate' | 'ai-suggestion' | 'unavailable';

const labels: Record<DataProvenance, string> = {
  verified: 'Verified',
  simulation: 'SIMULATION',
  'bookonce-derived': 'BookOnce derived',
  'bookonce-estimate': 'BookOnce estimate',
  'ai-suggestion': 'AI suggestion',
  unavailable: 'Unavailable',
};

export function DataProvenanceBadge({ provenance }: { provenance: DataProvenance }) {
  return <Badge variant="outline">{labels[provenance]}</Badge>;
}
