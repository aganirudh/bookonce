import type { JourneyRequest } from '../schemas/aiSchemas';

export interface JourneyFormData {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  travelers: string;
  intent: 'urgent' | 'leisure';
  userName: string;
}

export function buildJourneyRequest(form: JourneyFormData): JourneyRequest {
  return {
    origin: { name: form.origin.trim() },
    destination: { name: form.destination.trim() },
    departureDate: form.departureDate,
    ...(form.returnDate ? { returnDate: form.returnDate } : {}),
    travelers: Number(form.travelers),
    travelStyle: form.intent,
  };
}
