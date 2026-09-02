export const scheduledFlight = {
  flight_date: '2026-09-15', flight_status: 'scheduled',
  departure: { iata: 'BLR', scheduled: '2026-09-15T09:00:00+05:30', estimated: '2026-09-15T09:00:00+05:30', delay: null },
  arrival: { iata: 'DEL', scheduled: '2026-09-15T11:45:00+05:30', estimated: '2026-09-15T11:45:00+05:30' },
  airline: { iata: 'AI', icao: 'AIC' }, flight: { number: '202', iata: 'AI202', icao: 'AIC202' }, live: { updated: '2026-09-15T02:45:00+00:00' },
};

export const delayedFlight = {
  ...scheduledFlight, flight_status: 'active',
  departure: { ...scheduledFlight.departure, estimated: '2026-09-15T09:42:00+05:30', delay: 42 },
};

export const cancelledFlight = { ...scheduledFlight, flight_status: 'cancelled' };
