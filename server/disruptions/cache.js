export class DisruptionStatusCache {
  constructor({ ttlMs = 90_000, now = Date.now } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.entries = new Map();
  }

  key(subject) {
    return JSON.stringify([
      subject.carrierCode?.trim().toUpperCase(), subject.flightNumber?.trim().toUpperCase(),
      subject.scheduledDeparture ?? null, subject.originCode?.trim().toUpperCase() ?? null,
      subject.destinationCode?.trim().toUpperCase() ?? null,
    ]);
  }

  get(subject) {
    const key = this.key(subject);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) { this.entries.delete(key); return undefined; }
    return structuredClone(entry.value);
  }

  set(subject, value) {
    this.entries.set(this.key(subject), { value: structuredClone(value), expiresAt: this.now() + this.ttlMs });
  }
}
