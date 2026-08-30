import { z } from 'zod';
import {
  ItinerarySchema,
  JourneyRequestSchema,
  JourneySegmentSchema,
  LocationSchema,
  TransportModeSchema,
  TravelStyleSchema,
} from './aiSchemas.runtime.js';

export {
  ItinerarySchema,
  JourneyRequestSchema,
  JourneySegmentSchema,
  LocationSchema,
  TransportModeSchema,
  TravelStyleSchema,
};

export type Location = z.infer<typeof LocationSchema>;
export type TravelStyle = z.infer<typeof TravelStyleSchema>;
export type JourneyRequest = z.infer<typeof JourneyRequestSchema>;
export type TransportMode = z.infer<typeof TransportModeSchema>;
export type JourneySegment = z.infer<typeof JourneySegmentSchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
