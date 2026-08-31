import type { CompatibilityResult, WeatherActivity } from '../weather/types';

export type ReplanChange =
  | { type: 'swap'; firstActivityId: string; secondActivityId: string; reason: string }
  | { type: 'warning'; activityId: string; reason: string };

export interface ReplanResult { original: WeatherActivity[]; proposed: WeatherActivity[]; changes: ReplanChange[] }

export function proposeWeatherReplan(activities: readonly WeatherActivity[], results: readonly CompatibilityResult[]): ReplanResult {
  const original = activities.map(item => ({ ...item }));
  const proposed = activities.map(item => ({ ...item }));
  const changes: ReplanChange[] = [];
  for (let index = 0; index < proposed.length; index += 1) {
    const activity = proposed[index];
    const conflict = results.find(result => result.activityId === activity.id)?.compatibility === 'unsuitable';
    if (!conflict || activity.flexibility !== 'flexible' || activity.category !== 'outdoor' || !activity.timestamp) continue;
    const replacementIndex = proposed.findIndex((candidate, candidateIndex) => candidateIndex !== index && candidate.flexibility === 'flexible' && candidate.category === 'indoor' && candidate.timestamp && candidate.timestamp.slice(0, 10) === activity.timestamp!.slice(0, 10) && results.find(result => result.activityId === candidate.id)?.compatibility === 'compatible');
    if (replacementIndex < 0) {
      changes.push({ type: 'warning', activityId: activity.id, reason: 'Weather conflict detected; no compatible flexible activity was available.' });
      continue;
    }
    const replacement = proposed[replacementIndex];
    const firstTime = activity.timestamp;
    activity.timestamp = replacement.timestamp;
    replacement.timestamp = firstTime;
    proposed[index] = replacement;
    proposed[replacementIndex] = activity;
    changes.push({ type: 'swap', firstActivityId: activity.id, secondActivityId: replacement.id, reason: 'Heavy rain is expected during the outdoor activity, so a compatible indoor activity was moved to that time.' });
    break;
  }
  return { original, proposed, changes };
}
