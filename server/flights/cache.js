export class FlightSearchCache {
  constructor({ ttlMs = 3 * 60_000, now = Date.now } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.entries = new Map();
  }

  key(query) {
    return JSON.stringify([
      query.origin, query.destination, query.departureDate, query.adults, query.children,
      query.infants, query.cabinClass, query.currency, query.market, query.locale,
    ]);
  }

  get(query) {
    const key = this.key(query);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(query, value) {
    this.entries.set(this.key(query), { value, expiresAt: this.now() + this.ttlMs });
  }
}
